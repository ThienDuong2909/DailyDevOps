import { NextResponse } from 'next/server';
import { siteUrl, fetchSitemapData } from '@/lib/sitemap';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
    const { posts } = await fetchSitemapData();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/main-sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${posts
        .map((post) => `
    <url>
        <loc>${siteUrl}/${post.slug}</loc>
        <lastmod>${new Date(post.updatedAt || post.publishedAt || Date.now()).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`)
        .join('')}
</urlset>`;

    return new NextResponse(xml, {
        headers: { 'Content-Type': 'application/xml' },
    });
}
