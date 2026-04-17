import { NextResponse } from 'next/server';
import { siteUrl, fetchSitemapData, buildSitemapXml } from '@/lib/sitemap';

export const revalidate = 3600;

export async function GET() {
    const { tags } = await fetchSitemapData();

    const items = tags
        .filter((tag) => tag._count.posts > 0)
        .map((tag) => ({
            url: `${siteUrl}/tag/${tag.slug}`,
            lastModified: new Date(tag.updatedAt).toISOString(),
            changeFrequency: 'monthly',
            priority: 0.5,
        }));

    const xml = buildSitemapXml(items);

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
    });
}
