# DailyDevOps (Client) — Danh sách Issues

> **Repo:** `ThienDuong2909/DailyDevOps`
> **Stack:** Next.js 15 (App Router) + React 19 + TypeScript strict + Tailwind 3 + axios + zustand + TipTap + Sentry + Playwright
> **Điểm tổng thể:** 7/10 — setup hạ tầng chuẩn (App Router, i18n, SEO sitemap, standalone Docker) nhưng **đang dùng sai sức mạnh của Next.js**: trang detail và listing đều client-side fetch, bỏ phí SSR/ISR.

---

## 🔴 Critical (cần làm trước)

### C1. Toàn bộ trang blog/listing/admin đều `'use client'` + client-side fetch

- `app/(main)/blog/[slug]/blog-detail-client.tsx` = **1107 dòng, `'use client'`**, fetch post + comments + related + view-count increment đều ở client qua axios.
- **20+ page files** có `'use client'` ở đầu.
- `page.tsx` thường chỉ là wrapper render client component.

**Hậu quả:**

- **SEO rất yếu:** Googlebot crawl thấy HTML rỗng + spinner. Google "có thể" render JS nhưng tốn crawl budget và indexing chậm. Bing/Yandex/Baidu đa số không render JS.
- **LCP tệ:** user thấy trắng → spinner → content. Core Web Vitals sẽ đỏ.
- **Không ISR được:** không có `revalidate` trên page vì data ở client.
- **Double fetch** nếu sau này bật SSR: SSR + CSR cùng fetch.

**Fix (đúng như `improve.md` item #1):**

```tsx
// app/[locale]/[slug]/page.tsx (server component)
export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await fetchAllSlugs();
  return posts.flatMap((p) =>
    LOCALES.map((l) => ({ locale: l, slug: p.slug })),
  );
}

export async function generateMetadata({ params }) {
  /* per-post OG */
}

export default async function Page({ params }) {
  const { locale, slug } = await params;
  const post = await fetchPostBySlug(slug, locale); // server-side
  return <BlogDetailClient initialPost={post} />;
}
```

Client component nhận `initialPost` làm `initialData`, chỉ refetch khi cần (vd comments realtime). Đây là pattern **hybrid SSR + client interactivity** chuẩn của Next.js 15.

---

### C2. `timeout: 3600000` trong axios — 1 giờ, không phải 60s

File: `lib/api/client.ts` (dòng 11-14)

```ts
const api = axios.create({
    baseURL: resolveApiBaseUrl(),
    timeout: 3600000, // Increased to 60s to accommodate slow AI formatting requests
    ...
});
```

Comment ghi "60s" nhưng giá trị là **3,600,000 ms = 1 tiếng**. Nếu server hang, browser giữ TCP connection 1 tiếng → dễ dẫn đến exhaust connection pool, user bị treo UI.

**Fix:**

```ts
timeout: 60000, // 60s default
```

Và cho riêng endpoint AI formatter:

```ts
api.post("/api/v1/posts/format", data, { timeout: 360000 }); // override 6 phút
```

---

### C3. Access token lưu trong `localStorage` — XSS leak

File: `lib/api/client.ts` (dòng 20-46)

```ts
export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem("accessToken", token);
    return;
  }
  localStorage.removeItem("accessToken");
};
```

Bất kỳ XSS nào (script injection qua bình luận, qua rich-text editor, qua dependency bị compromise) cũng đọc được token và impersonate user.

**Best practice:**

- Access token → **chỉ in-memory** (biến module-level, bạn đã có sẵn).
- Refresh token → HttpOnly cookie (đã đúng).
- Khi user reload page → token in-memory mất → axios interceptor gặp 401 → auto-refresh từ cookie → có lại token in-memory.

Bạn đã có flow refresh rồi, chỉ cần **bỏ `localStorage.setItem/getItem/removeItem`** là xong. Flow UX không đổi (vì reload sẽ tự refresh).

---

### C4. Cookie cross-subdomain vs `SameSite=strict`

Backend set refresh cookie tại `api.dailydevops.blog` với `sameSite: 'strict'`.
Nếu browser từ `dailydevops.blog` gọi thẳng `api.dailydevops.blog` (cross-site), **SameSite=strict block cookie** → refresh flow silently fail.

Kiểm tra luồng thực tế:

- **Nếu** browser call qua Next.js rewrite (`/api/v1/...` → Next server → API backend), cookie nằm trên origin `dailydevops.blog` → OK với strict.
- **Nếu** browser call thẳng `api.dailydevops.blog` (qua `NEXT_PUBLIC_API_URL` trực tiếp), cần đổi sang:
  - `sameSite: 'lax'`
  - `domain: '.dailydevops.blog'` (để cookie share giữa apex + api subdomain)

Check Loki logs xem `/auth/refresh` có nhận được cookie không trên production.

---

## 🟠 Medium (làm sau critical)

### M1. Component quá lớn — React anti-pattern

| File                                            | Số dòng  |
| ----------------------------------------------- | -------- |
| `app/(admin)/admin/articles/[id]/page.tsx`      | **1908** |
| `app/(main)/blog/[slug]/blog-detail-client.tsx` | **1107** |
| `app/(main)/account/page.tsx`                   | 1012     |
| `app/(admin)/admin/comments/page.tsx`           | 737      |
| `app/(admin)/admin/seo/page.tsx`                | 638      |
| `app/(admin)/admin/articles/page.tsx`           | 614      |
| `app/(admin)/admin/page.tsx`                    | 605      |
| `app/(admin)/admin/media/page.tsx`              | 530      |
| `components/admin/rich-text-editor.tsx`         | **1387** |
| `components/blog/blog-listing-content.tsx`      | 664      |

**Vấn đề:**

- Re-render cả cây khi 1 state thay đổi.
- Khó memoize đúng chỗ (React Compiler của React 19 có thể giúp, nhưng chưa stable).
- Hard to test.
- Coupling cao, mental load khi đọc.

**Fix:** Split theo feature — `<PostEditor>`, `<PostMeta>`, `<PostSidebar>`, `<PostCommentsPanel>`, `<PostToc>`, `<RelatedPostsList>`, v.v. Co-locate `useQuery`/`useMutation` hooks trong thư mục từng feature.

---

### M2. Không có `generateStaticParams` + `generateMetadata` động cho blog post

Metadata hiện chỉ có ở root `app/layout.tsx` → Google thấy **tiêu đề/OG giống hệt cho mọi bài viết**. Cực kém SEO — mỗi bài viết nên có:

- Title riêng
- Description riêng (từ excerpt)
- OG image riêng (featured image)
- Canonical URL riêng
- `article:published_time`, `article:author`, `article:tag`

**Fix:**

```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await fetchPostBySlug(slug, locale);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.featuredImage],
      type: "article",
      publishedTime: post.publishedAt,
    },
    alternates: { canonical: `${siteUrl}/${locale}/${post.slug}` },
  };
}
```

---

### M3. Material Symbols load từ Google Fonts — blocking external

File: `app/layout.tsx` (dòng 123-127)

```tsx
<link
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
  rel="stylesheet"
/>
```

External blocking request → hurt LCP. Options:

- Dùng `next/font/google` (self-host, Next.js tự inline critical CSS).
- Bạn đã có `lucide-react` — **chuyển toàn bộ sang lucide, bỏ Material Symbols** để giảm 1 font external và nhẹ bundle.

---

### M4. `DOCKER_BUILDKIT = '0'` trong Jenkinsfile

File: `Jenkinsfile` (dòng 35-36)

```groovy
// Define Docker BuildKit explicitly to resolve legacy builder "unknown parent image ID" bugs
DOCKER_BUILDKIT = '0'
```

Legacy builder rất chậm + không có cache mounts, không multi-platform. Bug "unknown parent image ID" đã được fix từ lâu.

**Fix:** Bật lại BuildKit + dùng `docker buildx`:

```bash
docker buildx build \
  --cache-to=type=registry,ref=${IMAGE_TAG}:buildcache,mode=max \
  --cache-from=type=registry,ref=${IMAGE_TAG}:buildcache \
  -t ${IMAGE_TAG}:${BUILD_NUMBER} .
```

Build incremental từ Docker Hub layer cache → builds sau nhanh hơn nhiều.

---

### M5. `.env.production` baked vào Docker image

File: `Dockerfile` (dòng 33)

```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/.env.production ./.env.production
```

Với Next.js standalone:

- `NEXT_PUBLIC_*` được inlined vào JS bundle lúc `npm run build` → nằm trong static assets → **không thay đổi runtime được**.
- Các biến server-side (không có prefix) như `INTERNAL_API_URL` → đang ở sai chỗ, nên inject qua K8s env tại runtime.

**Hiện tại đang double-source conflict:**

- Jenkins inject vào `.env.production` lúc build.
- K8s deployment.yaml set env var lúc runtime.

**Fix:**

- Chỉ giữ `NEXT_PUBLIC_*` trong `.env.production` (build-time).
- Bỏ `INTERNAL_API_URL` khỏi `.env.production` → để deployment.yaml set.

---

### M6. Không có Content Security Policy (CSP) header

Layout có inline scripts (theme initializer + JSON-LD) và external Google Fonts. Hiện không có CSP → XSS dễ hơn.

**Fix (chọn 1):**

Option A — `next.config.js`:

```js
async headers() {
  return [{
    source: '/(.*)',
    headers: [{
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://*.sentry.io",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.dailydevops.blog https://*.sentry.io",
        "frame-ancestors 'none'",
      ].join('; ')
    }]
  }];
}
```

Option B — Traefik middleware (đỡ phải rebuild image):

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: security-headers
spec:
  headers:
    contentSecurityPolicy: "..."
```

---

### M7. Admin route guard chỉ check client-side

File: `app/(admin)/layout.tsx` (dòng 10-22)

```tsx
<AdminRouteGuard>
  <AdminSidebar />
  ...
</AdminRouteGuard>
```

`AdminRouteGuard` là client component → user **không phải admin vẫn tải được JS bundle admin**, flash content rồi bị redirect. Bad UX + leak page structure.

**Fix:** Thêm check ở Next.js middleware (server-side):

```ts
// middleware.ts
if (pathname.startsWith("/admin")) {
  const token = request.cookies.get("refreshToken")?.value;
  const role = await verifyTokenAndGetRole(token);
  if (!role || !["ADMIN", "MODERATOR", "EDITOR"].includes(role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
```

Giữ `AdminRouteGuard` ở client làm fallback/UX smooth.

---

## 🟡 Low / nits

### L1. Dev scratch files committed vào repo

- `jenkin_log.txt` (393 dòng log Jenkins)
- `text.txt`
- `icon-new.png` (leftover asset?)
- `skills-lock.json` (nếu không dùng)
- `improve.md` — có thể giữ, nhưng nên move sang `docs/ROADMAP.md`

**Fix:** thêm vào `.gitignore`:

```
*.log
jenkin_log.txt
text.txt
```

---

### L2. E2E tests gated `RUN_E2E=true` → không bao giờ chạy trong CI

File: `Jenkinsfile` (dòng 52, 130-139)

```groovy
RUN_E2E = "${env.RUN_E2E ?: 'false'}"
...
when { expression { env.RUN_E2E == 'true' } }
```

Playwright tests tồn tại nhưng default off → sẽ bitrot (1-2 tháng không chạy, selector sẽ lỗi thời).

**Fix (chọn 1):**

- Tối thiểu chạy 1 smoke test (homepage render + login flow) **mỗi build**.
- Tách stage "e2e" thành nightly Jenkins job.
- Đặt `RUN_E2E = 'true'` default, chỉ skip khi có tag `[skip-e2e]` trong commit message.

---

### L3. `export { default, apiClient }` — 2 tên cho cùng 1 thứ

File: `lib/api.ts` (dòng 1-2)

```ts
export { default, apiClient } from "./api/client";
export { getAccessToken, setAccessToken } from "./api/client";
```

`client.ts` có `export default api` và `export const apiClient = api` (hoặc tương đương). Hai tên cho cùng 1 instance gây confuse khi đọc code.

**Fix:** Chuẩn hoá 1 tên (`apiClient`), update imports.

---

### L4. Duplicate site URL resolve logic

Có ít nhất 3 chỗ resolve site URL với fallback giống nhau:

```ts
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://dailydevops.blog";
```

(xuất hiện trong `app/layout.tsx`, `app/robots.ts`, `lib/sitemap.ts`, ...)

**Fix:** Extract vào `lib/constants/site.ts`:

```ts
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://dailydevops.blog";
```

---

### L5. `lib/api.ts` chỉ re-export — tăng 1 lớp gián tiếp vô nghĩa

```ts
// lib/api.ts
export { default, apiClient } from "./api/client";
export { getAccessToken, setAccessToken } from "./api/client";
```

```ts
// lib/auth/index.ts
export { getAccessToken, setAccessToken } from "../api/client";
```

Re-export lại re-export. Xoá `lib/api.ts`, import trực tiếp từ `@/lib/api/client` ở mọi nơi.

---

### L6. Tailwind custom colors có thể centralize

Grep thấy nhiều class hardcode: `bg-[#1e293b]`, `text-[#9dabb9]`, `border-border-dark`, `bg-background-dark`, v.v. Một số đã define trong `tailwind.config.js` nhưng vẫn có arbitrary values rải rác.

**Fix:** Scan toàn bộ arbitrary values, move vào `tailwind.config.js` theme → đảm bảo palette consistent, dễ đổi theme sau.

---

### L7. Không có pre-commit hook

Không thấy `.husky/` hoặc `lint-staged` config.

**Fix:** Thêm husky + lint-staged để chạy `eslint --fix` + `prettier --write` trước mỗi commit.

```json
// package.json
"lint-staged": {
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"]
}
```

---
