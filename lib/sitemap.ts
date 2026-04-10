export const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://dailydevops.blog';

const apiBaseUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001';

export interface SitemapPost {
    slug: string;
    updatedAt: string;
    publishedAt: string | null;
    featuredImage: string | null;
    category: { slug: string } | null;
}

export interface SitemapCategory {
    slug: string;
    updatedAt: string;
    _count: { posts: number };
}

export interface SitemapTag {
    slug: string;
    updatedAt: string;
    _count: { posts: number };
}

// Fetch tất cả data từ backend
export async function fetchSitemapData(): Promise<{
    posts: SitemapPost[];
    categories: SitemapCategory[];
    tags: SitemapTag[];
}> {
    try {
        const res = await fetch(`${apiBaseUrl}/api/v1/seo/sitemap-data`, {
            next: { revalidate: 3600 }, 
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
