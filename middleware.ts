import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { DEFAULT_LOCALE, isSupportedLocale, LOCALE_COOKIE_NAME } from '@/lib/i18n/config';

/**
 * Check if a pathname looks like a static file (has an extension after last slash).
 * Uses string operations instead of regex to avoid ReDoS concerns.
 */
function isPublicFile(pathname: string): boolean {
    const lastSlash = pathname.lastIndexOf('/');
    const afterSlash = lastSlash >= 0 ? pathname.slice(lastSlash + 1) : pathname;
    return afterSlash.includes('.');
}
const PASSTHROUGH_PREFIXES = [
    '/api',
    '/admin',
    '/login',
    '/register',
    '/reset-password',
    '/forgot-password',
    '/verify-email',
    '/_next',
    '/uploads',
];
const PASSTHROUGH_EXACT = [
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/rss.xml',
    '/post-sitemap.xml',
    '/page-sitemap.xml',
    '/category-sitemap.xml',
    '/tag-sitemap.xml',
    '/manifest.webmanifest',
    '/site.webmanifest',
];

export function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl;
    const preferredLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;

    if (
        isPublicFile(pathname) ||
        PASSTHROUGH_EXACT.includes(pathname) ||
        PASSTHROUGH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    ) {
        return NextResponse.next();
    }

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && isSupportedLocale(segments[0])) {
        const response = NextResponse.next();

        if (preferredLocale !== segments[0]) {
            response.cookies.set(LOCALE_COOKIE_NAME, segments[0], {
                path: '/',
                maxAge: 60 * 60 * 24 * 365,
                sameSite: 'lax',
            });
        }

        return response;
    }

    const resolvedLocale = isSupportedLocale(preferredLocale) ? preferredLocale : DEFAULT_LOCALE;

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname === '/' ? `/${resolvedLocale}` : `/${resolvedLocale}${pathname}`;
    redirectUrl.search = search;

    const response = NextResponse.redirect(redirectUrl, 308);
    response.cookies.set(LOCALE_COOKIE_NAME, resolvedLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
    });

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image).*)'],
};
