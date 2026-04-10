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
            return { posts: [], categories: [], tags: [] };
        }

        const json = await res.json();
        return json.data || { posts: [], categories: [], tags: [] };
    } catch {
        return { posts: [], categories: [], tags: [] };
    }
}

export interface SitemapItem {
    url: string;
    lastModified: string;
    changeFrequency?: string;
    priority?: number | string;
}

export function buildSitemapXml(items: SitemapItem[]): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${siteUrl}/main-sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.map((item) => `    <url>
        <loc>${item.url}</loc>
        <lastmod>${item.lastModified}</lastmod>
        ${item.changeFrequency ? `<changefreq>${item.changeFrequency}</changefreq>` : ''}
        ${item.priority ? `<priority>${item.priority}</priority>` : ''}
    </url>`).join('\n')}
</urlset>`;
}

export function buildSitemapIndexXml(items: SitemapItem[]): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${siteUrl}/main-sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.map((item) => `    <sitemap>
        <loc>${item.url}</loc>
        <lastmod>${item.lastModified}</lastmod>
    </sitemap>`).join('\n')}
</sitemapindex>`;
}
