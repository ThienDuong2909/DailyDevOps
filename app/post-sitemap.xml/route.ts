import { NextResponse } from 'next/server';
import { siteUrl, fetchSitemapData, buildSitemapXml } from '@/lib/sitemap';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
    const { posts } = await fetchSitemapData();

    const items = posts.map((post) => ({
        url: `${siteUrl}/${post.slug}`,
        lastModified: new Date(post.updatedAt || post.publishedAt || Date.now()).toISOString(),
        changeFrequency: 'weekly',
        priority: 0.8,
    }));

    const xml = buildSitemapXml(items);

    return new NextResponse(xml, {
        headers: { 'Content-Type': 'application/xml' },
    });
}
