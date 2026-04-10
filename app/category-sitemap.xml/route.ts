import { NextResponse } from 'next/server';
import { siteUrl, fetchSitemapData } from '@/lib/sitemap';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
    const { categories } = await fetchSitemapData();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/main-sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${categories
        .filter((cat) => cat._count.posts > 0)
        .map((cat) => `
    <url>
        <loc>${siteUrl}/category/${cat.slug}</loc>
        <lastmod>${new Date(cat.updatedAt).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>`)
        .join('')}
</urlset>`;

    return new NextResponse(xml, {
        headers: { 'Content-Type': 'application/xml' },
    });
}
