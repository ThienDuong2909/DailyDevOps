import { NextResponse } from 'next/server';
import { siteUrl, fetchSitemapData, buildSitemapIndexXml } from '@/lib/sitemap';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
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

    const items = [
        { url: `${siteUrl}/page-sitemap.xml`, lastModified: new Date().toISOString() },
        { url: `${siteUrl}/post-sitemap.xml`, lastModified: latestPostDate.toISOString() },
        { url: `${siteUrl}/category-sitemap.xml`, lastModified: latestCategoryDate.toISOString() },
        { url: `${siteUrl}/tag-sitemap.xml`, lastModified: latestTagDate.toISOString() },
    ];

    const xml = buildSitemapIndexXml(items);

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}
