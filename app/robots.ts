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
    "/tag",
    "/tag/",
    "/about",
    "/contact",
    "/newsletter",
    "/privacy-policy",
    "/terms-of-service",
    "/cookie-policy",
    "/dmca-policy",
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
