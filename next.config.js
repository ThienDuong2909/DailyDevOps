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
     * URL routing strategy: cookie-based locale, no locale prefix in URL.
     *
     * Clean URLs (/blog/slug) are internally rewritten to the locale-prefixed
     * app router path (/vi/blog/slug or /en/blog/slug) based on the
     * `preferred_locale` cookie — invisible to the user.
     *
     * Any direct access to /vi/* or /en/* is redirected (302) back to the
     * clean URL so there is exactly one canonical URL per page.
     */
    async rewrites() {
        return {
            beforeFiles: [
                // API proxy — runs before locale rewrites
                {
                    source: '/api/v1/:path*',
                    destination: `${apiBaseUrl}/api/v1/:path*`,
                },
            ],
            afterFiles: [
                // Root /
                {
                    source: '/',
                    has: [{ type: 'cookie', key: 'preferred_locale', value: 'en' }],
                    destination: '/en',
                },
                {
                    source: '/',
                    destination: '/vi',
                },
                // All other clean paths — skip internal/asset prefixes
                {
                    source: '/:path((?!vi/|en/|vi$|en$|_next|api|uploads|favicon|robots|sitemap|rss|manifest|apple-icon|opengraph|twitter).*)',
                    has: [{ type: 'cookie', key: 'preferred_locale', value: 'en' }],
                    destination: '/en/:path',
                },
                {
                    source: '/:path((?!vi/|en/|vi$|en$|_next|api|uploads|favicon|robots|sitemap|rss|manifest|apple-icon|opengraph|twitter).*)',
                    destination: '/vi/:path',
                },
            ],
            fallback: [],
        };
    },

    // Block direct /vi/* and /en/* access — redirect to clean URL.
    // Using permanent: false (302) since this is an architectural choice,
    // not a content move.
    async redirects() {
        return [
            { source: '/vi', destination: '/', permanent: false },
            { source: '/vi/:path*', destination: '/:path*', permanent: false },
            { source: '/en', destination: '/', permanent: false },
            { source: '/en/:path*', destination: '/:path*', permanent: false },
        ];
    },
};

module.exports = nextConfig;
