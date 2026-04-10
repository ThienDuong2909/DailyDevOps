import { NextResponse } from 'next/server';
import { siteUrl, fetchSitemapData } from '@/lib/sitemap';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
    const { tags } = await fetchSitemapData();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/main-sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${tags
        .filter((tag) => tag._count.posts > 0)
        .map((tag) => `
    <url>
        <loc>${siteUrl}/tag/${tag.slug}</loc>
        <lastmod>${new Date(tag.updatedAt).toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>`)
        .join('')}
</urlset>`;

    return new NextResponse(xml, {
        headers: { 'Content-Type': 'application/xml' },
    });
}
