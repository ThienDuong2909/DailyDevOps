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
