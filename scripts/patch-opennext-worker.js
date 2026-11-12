/**
 * Post-build patch for @opennextjs/cloudflare worker.js:
 * - Preserves API_SERVICE Service Binding interception for SSR & client /api/v1/* calls
 * - Preserves Cloudflare Edge Cache (caches.default) + automatic versioned invalidation
 * - Computes granular per-route code hashes (ROUTE_CODE_HASHES) at build time so editing
 *   a small piece of code only invalidates the affected route group's SSR HTML cache
 *   without flushing the rest of the website or static assets.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const workerPath = path.join(rootDir, '.open-next', 'worker.js');
const buildIdFile = path.join(rootDir, '.next', 'BUILD_ID');
const buildId = fs.existsSync(buildIdFile) ? fs.readFileSync(buildIdFile, 'utf8').trim() : Date.now().toString(36);

function collectFiles(targetPath, acc = []) {
    const fullPath = path.join(rootDir, targetPath);
    if (!fs.existsSync(fullPath)) return acc;
    const stat = fs.statSync(fullPath);
    if (stat.isFile()) {
        acc.push(fullPath);
    } else if (stat.isDirectory()) {
        for (const entry of fs.readdirSync(fullPath).sort()) {
            collectFiles(path.join(targetPath, entry), acc);
        }
    }
    return acc;
}

function hashPaths(relativePaths) {
    const hash = crypto.createHash('sha256');
    const files = [];
    for (const rel of relativePaths) {
        collectFiles(rel, files);
    }
    for (const file of files) {
        hash.update(path.relative(rootDir, file).replace(/\\/g, '/'));
        hash.update(fs.readFileSync(file));
    }
    return hash.digest('hex').slice(0, 8);
}

const baseLayoutPaths = [
    'app/layout.tsx',
    'app/globals.css',
    'app/(main)/layout.tsx',
    'app/[locale]',
    'lib',
    'stores',
    'hooks',
    'components/layout',
    'components/ui',
    'components/shared',
    'components/i18n',
];

const routeCodeHashes = {
    home: hashPaths([...baseLayoutPaths, 'app/(main)/page.tsx', 'components/home']),
    blog: hashPaths([...baseLayoutPaths, 'app/(main)/blog', 'components/blog']),
    category: hashPaths([...baseLayoutPaths, 'app/(main)/category', 'components/blog']),
    tag: hashPaths([...baseLayoutPaths, 'app/(main)/tag', 'components/blog']),
    author: hashPaths([...baseLayoutPaths, 'app/(main)/author', 'components/blog']),
    search: hashPaths([...baseLayoutPaths, 'app/(main)/search', 'components/blog']),
    about: hashPaths([...baseLayoutPaths, 'app/(main)/about']),
    contact: hashPaths([...baseLayoutPaths, 'app/(main)/contact']),
    newsletter: hashPaths([...baseLayoutPaths, 'app/(main)/newsletter']),
    policy: hashPaths([
        ...baseLayoutPaths,
        'app/(main)/privacy-policy',
        'app/(main)/terms-of-service',
        'app/(main)/cookie-policy',
        'app/(main)/dmca-policy',
    ]),
    seo: hashPaths([
        'app/robots.ts',
        'app/rss.xml',
        'app/sitemap.xml',
        'app/sitemap_index.xml',
        'app/post-sitemap.xml',
        'app/category-sitemap.xml',
        'app/tag-sitemap.xml',
        'app/page-sitemap.xml',
    ]),
    default: hashPaths(baseLayoutPaths),
};

const workerCode = `//@ts-expect-error: Will be resolved by wrangler build
import { handleCdnCgiImageRequest, handleImageRequest } from "./cloudflare/images.js";
//@ts-expect-error: Will be resolved by wrangler build
import { runWithCloudflareRequestContext } from "./cloudflare/init.js";
//@ts-expect-error: Will be resolved by wrangler build
import { maybeGetSkewProtectionResponse } from "./cloudflare/skew-protection.js";
// @ts-expect-error: Will be resolved by wrangler build
import { handler as middlewareHandler } from "./middleware/handler.mjs";
//@ts-expect-error: Will be resolved by wrangler build
export { DOQueueHandler } from "./.build/durable-objects/queue.js";
//@ts-expect-error: Will be resolved by wrangler build
export { DOShardedTagCache } from "./.build/durable-objects/sharded-tag-cache.js";
//@ts-expect-error: Will be resolved by wrangler build
export { BucketCachePurge } from "./.build/durable-objects/bucket-cache-purge.js";
const nativeFetch = globalThis.fetch.bind(globalThis);
let webCacheVersion = "v1";
let webCacheVersionFetchedAt = 0;
const BUILD_ID = "${buildId}";

const ROUTE_CODE_HASHES = ${JSON.stringify(routeCodeHashes, null, 4)};

function getRouteCodeHash(pathname) {
    if (pathname === "/") return ROUTE_CODE_HASHES.home;
    if (pathname === "/category" || pathname.startsWith("/category/")) return ROUTE_CODE_HASHES.category;
    if (pathname === "/blog" || pathname.startsWith("/blog/")) return ROUTE_CODE_HASHES.blog;
    if (pathname.startsWith("/tag/")) return ROUTE_CODE_HASHES.tag;
    if (pathname.startsWith("/author/")) return ROUTE_CODE_HASHES.author;
    if (pathname === "/search" || pathname.startsWith("/search/")) return ROUTE_CODE_HASHES.search;
    if (pathname === "/about" || pathname.startsWith("/about/")) return ROUTE_CODE_HASHES.about;
    if (pathname === "/contact" || pathname.startsWith("/contact/")) return ROUTE_CODE_HASHES.contact;
    if (pathname === "/newsletter" || pathname.startsWith("/newsletter/")) return ROUTE_CODE_HASHES.newsletter;
    if (
        pathname === "/privacy-policy" ||
        pathname === "/terms-of-service" ||
        pathname === "/cookie-policy" ||
        pathname === "/dmca-policy"
    ) {
        return ROUTE_CODE_HASHES.policy;
    }
    if (
        pathname === "/robots.txt" ||
        pathname === "/rss.xml" ||
        pathname.endsWith("sitemap.xml") ||
        pathname.endsWith("sitemap_index.xml")
    ) {
        return ROUTE_CODE_HASHES.seo;
    }
    return ROUTE_CODE_HASHES.default;
}

async function getWebCacheVersion(apiService) {
    const now = Date.now();
    if (now - webCacheVersionFetchedAt < 15_000) {
        return webCacheVersion;
    }
    if (apiService) {
        try {
            const res = await apiService.fetch(new Request("https://api.dailydevops.blog/api/v1/cache-version"));
            if (res.ok) {
                const json = await res.json();
                if (json && json.version) {
                    webCacheVersion = String(json.version);
                }
            }
            webCacheVersionFetchedAt = now;
        } catch {
            // Keep existing version
        }
    }
    return webCacheVersion;
}

function isCacheablePublicWebPage(pathname) {
    const bypassPrefixes = [
        "/admin",
        "/login",
        "/register",
        "/account",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/api/",
        "/_next/",
        "/cdn-cgi/",
    ];
    for (const p of bypassPrefixes) {
        if (pathname === p || pathname.startsWith(p.endsWith("/") ? p : \`\${p}/\`)) {
            return false;
        }
    }
    return true;
}

function getCookieLocale(request) {
    const cookie = request.headers.get("cookie") || "";
    const match = cookie.match(/(?:^|;\\s*)preferred_locale=(en|vi)/);
    return match ? match[1] : "vi";
}

function withVaryCookie(headers) {
    const existing = headers.get("Vary") || "";
    const parts = existing
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    if (!parts.some((v) => v.toLowerCase() === "cookie")) {
        parts.push("Cookie");
    }
    headers.set("Vary", parts.join(", "));
}

export default {
    async fetch(request, env, ctx) {
        if (env.API_SERVICE && !globalThis.__API_FETCH_PATCHED) {
            globalThis.__API_FETCH_PATCHED = true;
            globalThis.fetch = async (input, init) => {
                try {
                    const reqUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input?.url || "";
                    if (
                        reqUrl.startsWith("https://devopsdaily-api.devopsdaily.workers.dev/") ||
                        reqUrl.startsWith("https://api.dailydevops.blog/")
                    ) {
                        const cleanInit = init ? { ...init } : undefined;
                        if (cleanInit && "next" in cleanInit) {
                            delete cleanInit.next;
                        }
                        return await globalThis.__CURRENT_API_SERVICE.fetch(new Request(input, cleanInit));
                    }
                } catch {
                    // Fallback to native fetch
                }
                return nativeFetch(input, init);
            };
        }
        globalThis.__CURRENT_API_SERVICE = env.API_SERVICE;
        return runWithCloudflareRequestContext(request, env, ctx, async () => {
            const response = maybeGetSkewProtectionResponse(request);
            if (response) {
                return response;
            }
            const url = new URL(request.url);

            // Canonical 301 redirect www -> apex domain
            if (url.hostname === "www.dailydevops.blog") {
                url.hostname = "dailydevops.blog";
                return Response.redirect(url.toString(), 301);
            }
            if (env.API_SERVICE && url.pathname.startsWith("/api/v1/")) {
                return env.API_SERVICE.fetch(request);
            }
            // Serve images in development.
            // Note: "/cdn-cgi/image/..." requests do not reach production workers.
            if (url.pathname.startsWith("/cdn-cgi/image/")) {
                return handleCdnCgiImageRequest(url, env);
            }
            // Fallback for the Next default image loader.
            if (url.pathname ===
                \`\${globalThis.__NEXT_BASE_PATH__}/_next/image\${globalThis.__TRAILING_SLASH__ ? "/" : ""}\`) {
                return await handleImageRequest(url, request.headers, env);
            }

            const edgeCache = typeof caches !== "undefined" && caches.default ? caches.default : null;
            const canCachePage =
                request.method === "GET" &&
                edgeCache &&
                isCacheablePublicWebPage(url.pathname) &&
                !url.pathname.startsWith("/vi/") &&
                !url.pathname.startsWith("/en/") &&
                url.pathname !== "/vi" &&
                url.pathname !== "/en";

            let pageCacheKey = null;
            let currentVersion = "v1";
            let routeHash = "default";
            if (canCachePage) {
                currentVersion = await getWebCacheVersion(env.API_SERVICE);
                routeHash = getRouteCodeHash(url.pathname);
                const locale = getCookieLocale(request);
                const isRsc = request.headers.get("rsc") === "1" ? "1" : "0";
                const cacheUrl = new URL(url.toString());
                cacheUrl.searchParams.set("__cv", \`\${BUILD_ID}_\${currentVersion}_\${routeHash}\`);
                cacheUrl.searchParams.set("__loc", locale);
                cacheUrl.searchParams.set("__rsc", isRsc);

                pageCacheKey = new Request(cacheUrl.toString(), { method: "GET" });
                const cachedPage = await edgeCache.match(pageCacheKey);
                if (cachedPage) {
                    const hitHeaders = new Headers(cachedPage.headers);
                    hitHeaders.set("Cache-Control", "public, max-age=0, must-revalidate");
                    withVaryCookie(hitHeaders);
                    hitHeaders.set("X-Edge-Cache", "HIT");
                    hitHeaders.set("X-Cache-Version", \`\${BUILD_ID}_\${currentVersion}\`);
                    hitHeaders.set("X-Route-Hash", routeHash);
                    return new Response(cachedPage.body, {
                        status: cachedPage.status,
                        headers: hitHeaders,
                    });
                }
            }

            // - \`Request\`s are handled by the Next server
            const reqOrResp = await middlewareHandler(request, env, ctx);
            if (reqOrResp instanceof Response) {
                return reqOrResp;
            }
            // @ts-expect-error: resolved by wrangler build
            const { handler } = await import("./server-functions/default/handler.mjs");
            const ssrResp = await handler(reqOrResp, env, ctx, request.signal);

            if (pageCacheKey && edgeCache && ssrResp.status === 200) {
                const edgeHeaders = new Headers(ssrResp.headers);
                edgeHeaders.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
                edgeHeaders.set("CDN-Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
                withVaryCookie(edgeHeaders);
                edgeHeaders.delete("set-cookie");

                const [edgeBody, clientBody] = ssrResp.body
                    ? ssrResp.body.tee()
                    : [null, null];

                const edgeCacheResp = new Response(edgeBody, {
                    status: 200,
                    headers: edgeHeaders,
                });

                if (ctx && typeof ctx.waitUntil === "function") {
                    ctx.waitUntil(edgeCache.put(pageCacheKey, edgeCacheResp));
                }

                const clientHeaders = new Headers(edgeHeaders);
                clientHeaders.set("Cache-Control", "public, max-age=0, must-revalidate");
                clientHeaders.set("X-Edge-Cache", "MISS");
                clientHeaders.set("X-Cache-Version", \`\${BUILD_ID}_\${currentVersion}\`);
                clientHeaders.set("X-Route-Hash", routeHash);

                return new Response(clientBody, {
                    status: 200,
                    headers: clientHeaders,
                });
            }

            return ssrResp;
        });
    },
};
`;

if (fs.existsSync(path.dirname(workerPath))) {
    fs.writeFileSync(workerPath, workerCode, 'utf8');
    console.log('[patch-opennext-worker] Applied API_SERVICE binding & Granular Route SSR Edge Cache:', routeCodeHashes);
}
