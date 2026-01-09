/** @type {import('next').NextConfig} */
const nextConfig = {
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
        ],
    },
    async rewrites() {
        return [
            {
                source: '/api/v1/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
