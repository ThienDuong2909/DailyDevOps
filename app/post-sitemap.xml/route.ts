import { NextResponse } from "next/server";
import {
  siteUrl,
  fetchSitemapData,
  buildSitemapXml,
  type SitemapItem,
} from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET() {
  const { posts } = await fetchSitemapData();

  const latestPostDate =
    posts.length > 0
      ? new Date(
          Math.max(
            ...posts.map((p) =>
              new Date(p.updatedAt || p.publishedAt || Date.now()).getTime(),
            ),
          ),
        ).toISOString()
      : new Date().toISOString();

  const items: SitemapItem[] = [
    {
      url: siteUrl,
      lastModified: latestPostDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...posts.map((post) => ({
      url: `${siteUrl}/${post.slug}`,
      lastModified: new Date(
        post.updatedAt || post.publishedAt || Date.now(),
      ).toISOString(),
      changeFrequency: "weekly",
      priority: 0.8,
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
