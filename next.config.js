/** @type {import('next').NextConfig} */
const apiBaseUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const parsedApiBaseUrl = new URL(apiBaseUrl);

const apiRemotePattern = {
    protocol: parsedApiBaseUrl.protocol.replace(':', ''),
    hostname: parsedApiBaseUrl.hostname,
    pathname: '/api/v1/media/**',
};

if (parsedApiBaseUrl.port) {
    apiRemotePattern.port = parsedApiBaseUrl.port;
}

const nextConfig = {
    output: 'standalone',
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: '**.googleusercontent.com',
            },
            apiRemotePattern,
            {
                protocol: 'https',
                hostname: 'api.dailydevops.blog',
                pathname: '/api/v1/media/**',
            },
        ],
    },
    // M6: Security headers — CSP, X-Frame-Options, etc.
    async headers() {
        return [{
            source: '/(.*)',
            headers: [
                {
                    key: 'Content-Security-Policy',
                    value: [
                        "default-src 'self'",
                        "script-src 'self' 'unsafe-inline' https://*.sentry.io https://www.googletagmanager.com",
                        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                        "font-src 'self' https://fonts.gstatic.com",
                        "img-src 'self' data: blob: https:",
                        "connect-src 'self' https://api.dailydevops.blog https://*.sentry.io https://www.googletagmanager.com https://www.google-analytics.com",
                        "frame-ancestors 'none'",
                    ].join('; '),
                },
                {
                    key: 'X-Frame-Options',
                    value: 'DENY',
                },
                {
                    key: 'X-Content-Type-Options',
                    value: 'nosniff',
                },
                {
                    key: 'Referrer-Policy',
                    value: 'strict-origin-when-cross-origin',
                },
            ],
        }];
    },
    /**
     * Locale-transparent URL rewrites.
     *
     * Goal: User sees clean URLs (/blog/slug) while the app router
     * internally receives the locale-prefixed path (/vi/blog/slug).
     *
     * How it works:
     *   1. beforeFiles: API proxy (runs first, before filesystem checks)
     *   2. afterFiles: locale rewrites (runs after filesystem, before 404)
     *      — Reads the `preferred_locale` cookie to decide which locale
     *        to rewrite to. Falls back to 'vi' when cookie is absent.
     *      — The catch-all rewrite maps EVERY clean path to /{locale}/{path}.
     *        Next.js internally routes it through [locale]/[[...segments]].
     *
     * IMPORTANT: /vi/* and /en/* direct paths still work (not rewritten here)
     * so old bookmarks / crawlers that already know the prefixed URLs keep working.
     * The redirects() below handle the SEO migration from prefixed → clean URLs.
     */
    async rewrites() {
        return {
            beforeFiles: [
                // API proxy — must stay in beforeFiles so it runs before locale rewrites
                {
                    source: '/api/v1/:path*',
                    destination: `${apiBaseUrl}/api/v1/:path*`,
                },
            ],
            afterFiles: [
                // Locale-transparent rewrite:
                // Any path that does NOT already start with a locale prefix
                // is internally rewritten to /{preferred_locale}/{path}.
                // The cookie is read via the `has` condition — Next.js matches
                // the cookie value and substitutes it into the destination.
                {
                    source: '/:path((?!vi|en|_next|api|uploads|favicon|robots|sitemap|rss|manifest|apple-icon|opengraph|twitter).*)',
                    has: [{ type: 'cookie', key: 'preferred_locale', value: 'en' }],
                    destination: '/en/:path',
                },
                {
                    source: '/:path((?!vi|en|_next|api|uploads|favicon|robots|sitemap|rss|manifest|apple-icon|opengraph|twitter).*)',
                    destination: '/vi/:path',
                },
                // Root / → /{locale}
                {
                    source: '/',
                    has: [{ type: 'cookie', key: 'preferred_locale', value: 'en' }],
                    destination: '/en',
                },
                {
                    source: '/',
                    destination: '/vi',
                },
            ],
            fallback: [],
        };
    },

    /**
     * SEO migration: redirect old prefixed URLs → clean URLs (308 permanent).
     *
     * Google has already indexed /vi/blog/slug and /en/blog/slug.
     * These redirects tell crawlers and users to update their bookmarks
     * to the canonical clean URL (/blog/slug).
     *
     * Using 308 (Permanent Redirect) to preserve POST method; 301 for GETs is fine too.
     * Set permanent: true → Next.js uses 308 by default.
     */
    async redirects() {
        return [
            // /vi/* → /* (strip Vietnamese prefix, it's the default)
            {
                source: '/vi',
                destination: '/',
                permanent: true,
            },
            {
                source: '/vi/:path*',
                destination: '/:path*',
                permanent: true,
            },
            // /en/* → /* (strip English prefix)
            {
                source: '/en',
                destination: '/',
                permanent: true,
            },
            {
                source: '/en/:path*',
                destination: '/:path*',
                permanent: true,
            },
        ];
    },
};

module.exports = nextConfig;
