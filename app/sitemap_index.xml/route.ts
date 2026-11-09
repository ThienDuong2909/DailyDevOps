import { NextResponse } from "next/server";
import { siteUrl, fetchSitemapData, buildSitemapIndexXml } from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET() {
  const { posts, categories } = await fetchSitemapData();

  const latestPostDate =
    posts.length > 0
      ? new Date(
          Math.max(
            ...posts.map((p) =>
              new Date(p.updatedAt || p.publishedAt || Date.now()).getTime(),
            ),
          ),
        )
      : new Date();

  const latestCategoryDate =
    categories.length > 0
      ? new Date(
          Math.max(...categories.map((c) => new Date(c.updatedAt).getTime())),
        )
      : new Date();

  const items = [
    {
      url: `${siteUrl}/post-sitemap.xml`,
      lastModified: latestPostDate.toISOString(),
    },
    {
      url: `${siteUrl}/category-sitemap.xml`,
      lastModified: latestCategoryDate.toISOString(),
    },
  ];

  const xml = buildSitemapIndexXml(items);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
