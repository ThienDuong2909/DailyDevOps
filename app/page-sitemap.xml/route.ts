import { NextResponse } from "next/server";
import { siteUrl, buildSitemapXml } from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET() {
  // Only include pages that are indexable (no noindex meta tag).
  // Excluded: privacy-policy, terms-of-service, cookie-policy, dmca-policy (noindex),
  //           search (dynamic content, should not be indexed).
  const pages = [
    { url: siteUrl, changeFrequency: "daily", priority: 1.0 },
    { url: `${siteUrl}/blog`, changeFrequency: "daily", priority: 0.9 },
  ];

  const items = pages.map((page) => ({
    url: page.url,
    lastModified: new Date().toISOString(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const xml = buildSitemapXml(items);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
