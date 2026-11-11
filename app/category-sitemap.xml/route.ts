import { NextResponse } from "next/server";
import { siteUrl, fetchSitemapData, buildSitemapXml } from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET() {
  const { categories } = await fetchSitemapData();
  const activeCategories = categories.filter((cat) => cat._count.posts > 0);
  const latestCategoryDate =
    activeCategories.length > 0
      ? new Date(
          Math.max(
            ...activeCategories.map((c) => new Date(c.updatedAt).getTime()),
          ),
        ).toISOString()
      : new Date().toISOString();

  const items = [
    {
      url: `${siteUrl}/category`,
      lastModified: latestCategoryDate,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...activeCategories.map((cat) => ({
      url: `${siteUrl}/category/${cat.slug}`,
      lastModified: new Date(cat.updatedAt).toISOString(),
      changeFrequency: "weekly",
      priority: 0.7,
    })),
  ];

  const xml = buildSitemapXml(items);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
