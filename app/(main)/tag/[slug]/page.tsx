import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/blog/post-card";
import { normalizeLocale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import type { PaginatedResponse, Post, Tag } from "@/types";

const apiBaseUrl =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

type TagsPayload = { data?: Tag[] } | Tag[];
type PostsPayload =
  | PaginatedResponse<Post>
  | { data?: PaginatedResponse<Post> | Post[] }
  | Post[];

function resolveTags(payload: TagsPayload): Tag[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return Array.isArray(payload.data) ? payload.data : [];
  }

  return [];
}

function resolvePosts(payload: PostsPayload): Post[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const nested = payload.data;

    if (Array.isArray(nested)) {
      return nested;
    }

    if (nested && typeof nested === "object" && "data" in nested) {
      return (nested.data as Post[]) || [];
    }
  }

  return (payload as PaginatedResponse<Post>)?.data || [];
}

async function fetchTags(): Promise<Tag[]> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/tags`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return [];
    }

    const json = await response.json();
    return resolveTags(json);
  } catch {
    return [];
  }
}

async function fetchPostsByTag(
  tagSlug: string,
  locale = "vi",
): Promise<Post[]> {
  try {
    const response = await fetch(
      `${apiBaseUrl}/api/v1/posts/published?tagSlug=${encodeURIComponent(tagSlug)}&limit=20&sortBy=publishedAt&sortOrder=desc&locale=${locale}`,
      {
        next: { revalidate: 300 },
      },
    );

    if (!response.ok) {
      return [];
    }

    const json = await response.json();
    return resolvePosts(json);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale?: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const resolvedLocale = locale
    ? normalizeLocale(locale)
    : await getRequestLocale();
  const tags = await fetchTags();
  const tag = tags.find((item) => item.slug === slug);

  if (!tag) {
    return {
      title: resolvedLocale === "en" ? "Tag Not Found" : "Không tìm thấy thẻ",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title:
      resolvedLocale === "en"
        ? `#${tag.name} Articles`
        : `Bài viết gắn thẻ #${tag.name}`,
    description:
      resolvedLocale === "en"
        ? `Browse DevOps Daily articles tagged with ${tag.name}.`
        : `Khám phá các bài viết Daily DevOps được gắn thẻ ${tag.name}.`,
    alternates: {
      canonical:
        resolvedLocale === "vi"
          ? `/tag/${tag.slug}`
          : `/${resolvedLocale}/tag/${tag.slug}`,
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string; locale?: string }>;
}) {
  const { slug, locale } = await params;
  const resolvedLocale = locale
    ? normalizeLocale(locale)
    : await getRequestLocale();
  const tags = await fetchTags();
  const tag = tags.find((item) => item.slug === slug);

  if (!tag) {
    notFound();
  }

  const posts = await fetchPostsByTag(tag.slug, resolvedLocale);
  const copy =
    resolvedLocale === "en"
      ? {
          label: "Tag",
          description: `Articles related to #${tag.slug}.`,
          count: `${posts.length} articles`,
          emptyTitle: "No articles for this tag yet",
          emptyBody:
            "When new posts are tagged with this topic, they will show up here.",
        }
      : {
          label: "Thẻ",
          description: `Các bài viết liên quan tới chủ đề #${tag.slug}.`,
          count: `${posts.length} bài viết`,
          emptyTitle: "Chưa có bài viết cho thẻ này",
          emptyBody:
            "Khi có bài viết mới gắn thẻ này, chúng sẽ hiển thị tại đây.",
        };

  return (
    <div className="flex w-full max-w-[1280px] flex-col gap-8">
      <section className="rounded-[28px] border border-gray-200 bg-white px-6 py-8 shadow-sm dark:border-gray-800 dark:bg-surface-dark md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {copy.label}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-main dark:text-white">
              #{tag.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-text-sub dark:text-gray-400">
              {copy.description}
            </p>
          </div>
          <div className="inline-flex items-center rounded-full border border-gray-200 bg-background-light px-4 py-2 text-sm font-medium text-text-sub dark:border-gray-700 dark:bg-background-dark dark:text-gray-300">
            {copy.count}
          </div>
        </div>
      </section>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 px-6 py-12 text-center dark:border-gray-700 dark:bg-surface-dark/60">
          <h2 className="text-lg font-semibold text-text-main dark:text-white">
            {copy.emptyTitle}
          </h2>
          <p className="mt-2 text-sm text-text-sub dark:text-gray-400">
            {copy.emptyBody}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
