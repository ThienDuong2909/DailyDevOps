import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  LOCALE_COOKIE_NAME,
} from "@/lib/i18n/config";

/**
 * Check if a pathname looks like a static file (has an extension after last slash).
 * Uses string operations instead of regex to avoid ReDoS concerns.
 */
function isPublicFile(pathname: string): boolean {
  const lastSlash = pathname.lastIndexOf("/");
  const afterSlash = lastSlash >= 0 ? pathname.slice(lastSlash + 1) : pathname;
  return afterSlash.includes(".");
}

const PASSTHROUGH_PREFIXES = [
  "/api",
  "/login",
  "/register",
  "/reset-password",
  "/forgot-password",
  "/verify-email",
  "/_next",
  "/uploads",
];

const PASSTHROUGH_EXACT = new Set([
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/sitemap_index.xml",
  "/rss.xml",
  "/post-sitemap.xml",
  "/page-sitemap.xml",
  "/category-sitemap.xml",
  "/tag-sitemap.xml",
  "/manifest.webmanifest",
  "/site.webmanifest",
]);

/**
 * Middleware responsibilities (Phase 2 — clean URL architecture):
 *
 * 1. Pass through static files, API routes, auth pages unchanged.
 * 2. Guard admin routes (server-side auth gate).
 * 3. Inject `x-locale` header so Server Components can read locale without
 *    parsing the URL segment — decouples locale from URL structure.
 * 4. Sync the `preferred_locale` cookie when a direct locale-prefixed link
 *    is visited (e.g. someone shares /en/blog/slug before migration completes).
 *
 * What middleware does NOT do anymore:
 * - Redirect /path → /vi/path  → handled by next.config.js rewrites (afterFiles)
 * - Redirect /vi/path → /path  → handled by next.config.js redirects()
 *
 * This avoids the redirect loop that would occur if middleware redirected
 * /blog/slug → /vi/blog/slug while redirects() sent /vi/blog/slug → /blog/slug.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const preferredLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;

  // Early exit: static files, known exact paths, and API/auth prefixes
  if (
    isPublicFile(pathname) ||
    PASSTHROUGH_EXACT.has(pathname) ||
    PASSTHROUGH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return NextResponse.next();
  }

  // M7: Server-side admin route guard — block unauthenticated users
  // before they download the admin JS bundle.
  // The client-side AdminRouteGuard remains as a role-level fallback.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }

  // Determine the active locale:
  // - If URL has a locale prefix (/vi/... or /en/...) → use that as source of truth
  //   (handles shared links, direct navigation before redirect kicks in)
  // - Otherwise → read cookie (the rewrite in next.config.js handles internal mapping)
  const segments = pathname.split("/").filter(Boolean);
  const urlLocale =
    segments.length > 0 && isSupportedLocale(segments[0]) ? segments[0] : null;

  const resolvedLocale =
    urlLocale ||
    (isSupportedLocale(preferredLocale) ? preferredLocale : DEFAULT_LOCALE);

  // Inject x-locale header so Server Components and server-side fetch() calls
  // can read the locale without parsing the URL path.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", resolvedLocale);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Sync cookie when locale was derived from a URL prefix (e.g. shared /en/... link),
  // so subsequent clean-URL requests continue using the correct locale via rewrites.
  if (urlLocale && preferredLocale !== urlLocale) {
    response.cookies.set(LOCALE_COOKIE_NAME, urlLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
