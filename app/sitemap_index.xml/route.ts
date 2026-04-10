import { NextResponse } from 'next/server';
import { siteUrl, fetchSitemapData } from '@/lib/sitemap';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
    // Optionally we could just return hardcoded sitemaps but getting real dates makes it premium
    const { posts, categories, tags } = await fetchSitemapData();
    
    const latestPostDate = posts.length > 0 
        ? new Date(Math.max(...posts.map(p => new Date(p.updatedAt || p.publishedAt || Date.now()).getTime())))
        : new Date();
        
    const latestCategoryDate = categories.length > 0
        ? new Date(Math.max(...categories.map(c => new Date(c.updatedAt).getTime())))
        : new Date();
        
    const latestTagDate = tags.length > 0
        ? new Date(Math.max(...tags.map(t => new Date(t.updatedAt).getTime())))
        : new Date();

    const sitemaps = [
        { url: `${siteUrl}/page-sitemap.xml`, lastModified: new Date() },
        { url: `${siteUrl}/post-sitemap.xml`, lastModified: latestPostDate },
        { url: `${siteUrl}/category-sitemap.xml`, lastModified: latestCategoryDate },
        { url: `${siteUrl}/tag-sitemap.xml`, lastModified: latestTagDate },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/main-sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${sitemaps
        .map(
            (sitemap) => `
    <sitemap>
        <loc>${sitemap.url}</loc>
        <lastmod>${sitemap.lastModified.toISOString()}</lastmod>
    </sitemap>`
        )
        .join('')}
</sitemapindex>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}
