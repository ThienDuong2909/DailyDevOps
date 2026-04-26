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
    async rewrites() {
        return [
            {
                source: '/api/v1/:path*',
                destination: `${apiBaseUrl}/api/v1/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
