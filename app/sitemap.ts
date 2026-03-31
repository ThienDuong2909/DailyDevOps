import type { MetadataRoute } from 'next';

const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://blog.thienduong.info';

const apiBaseUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001';

interface SitemapPost {
    slug: string;
    updatedAt: string;
    publishedAt: string | null;
    featuredImage: string | null;
    category: { slug: string } | null;
}

interface SitemapCategory {
    slug: string;
    updatedAt: string;
    _count: { posts: number };
}

interface SitemapTag {
    slug: string;
    updatedAt: string;
    _count: { posts: number };
}

async function fetchSitemapData(): Promise<{
    posts: SitemapPost[];
    categories: SitemapCategory[];
    tags: SitemapTag[];
}> {
    try {
        const res = await fetch(`${apiBaseUrl}/api/v1/seo/sitemap-data`, {
            next: { revalidate: 3600 }, // Revalidate every hour
        });

        if (!res.ok) {
            console.error(`Sitemap API responded with ${res.status}`);
            return { posts: [], categories: [], tags: [] };
        }

        const json = await res.json();
        return json.data || { posts: [], categories: [], tags: [] };
    } catch (error) {
        console.error('Failed to fetch sitemap data:', error);
        return { posts: [], categories: [], tags: [] };
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const { posts, categories, tags } = await fetchSitemapData();

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: siteUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
    ];

    // Blog post pages
    const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt || post.publishedAt || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    // Category pages (only those that have posts)
    const categoryPages: MetadataRoute.Sitemap = categories
        .filter((cat) => cat._count.posts > 0)
        .map((cat) => ({
            url: `${siteUrl}/category/${cat.slug}`,
            lastModified: new Date(cat.updatedAt),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }));

    // Tag pages (only those that have posts)
    const tagPages: MetadataRoute.Sitemap = tags
        .filter((tag) => tag._count.posts > 0)
        .map((tag) => ({
            url: `${siteUrl}/tag/${tag.slug}`,
            lastModified: new Date(tag.updatedAt),
            changeFrequency: 'monthly' as const,
            priority: 0.5,
        }));

    return [...staticPages, ...postPages, ...categoryPages, ...tagPages];
}
