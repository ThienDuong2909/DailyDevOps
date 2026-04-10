import { NextResponse } from 'next/server';
import { siteUrl, fetchSitemapData, buildSitemapXml } from '@/lib/sitemap';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
    const { categories } = await fetchSitemapData();

    const items = categories
        .filter((cat) => cat._count.posts > 0)
        .map((cat) => ({
            url: `${siteUrl}/category/${cat.slug}`,
            lastModified: new Date(cat.updatedAt).toISOString(),
            changeFrequency: 'weekly',
            priority: 0.6,
        }));

    const xml = buildSitemapXml(items);

    return new NextResponse(xml, {
        headers: { 'Content-Type': 'application/xml' },
    });
}
