import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants/site";

const siteUrl = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  const disallowedPaths = [
    "/admin",
    "/admin/",
    "/api",
    "/api/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/account",
    "/account/",
    "/search",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: disallowedPaths,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: disallowedPaths,
      },
    ],
    sitemap: `${siteUrl}/sitemap_index.xml`,
  };
}
