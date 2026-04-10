import { NextResponse } from 'next/server';
import { siteUrl } from '@/lib/sitemap';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
    const pages = [
        { url: siteUrl, changeFrequency: 'daily', priority: 1.0 },
        { url: `${siteUrl}/newsletter`, changeFrequency: 'weekly', priority: 0.7 },
        { url: `${siteUrl}/search`, changeFrequency: 'weekly', priority: 0.5 },
        { url: `${siteUrl}/about`, changeFrequency: 'monthly', priority: 0.4 },
        { url: `${siteUrl}/contact`, changeFrequency: 'monthly', priority: 0.4 },
        { url: `${siteUrl}/privacy-policy`, changeFrequency: 'monthly', priority: 0.3 },
        { url: `${siteUrl}/terms-of-service`, changeFrequency: 'monthly', priority: 0.3 },
        { url: `${siteUrl}/cookie-policy`, changeFrequency: 'monthly', priority: 0.3 },
        { url: `${siteUrl}/dmca-policy`, changeFrequency: 'monthly', priority: 0.3 },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/main-sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${pages
        .map(
            (page) => `
    <url>
        <loc>${page.url}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>${page.changeFrequency}</changefreq>
        <priority>${page.priority}</priority>
    </url>`
        )
        .join('')}
</urlset>`;

    return new NextResponse(xml, {
        headers: { 'Content-Type': 'application/xml' },
    });
}
