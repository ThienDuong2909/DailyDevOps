import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
    {
      status: 410,
      statusText: "Gone",
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=86400",
      },
    },
  );
}
