/**
 * Canonical site URL — single source of truth.
 * Used across layout metadata, sitemap, robots.txt, RSS, and SEO helpers.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://dailydevops.blog";

/**
 * Internal API base URL — resolves to the K8s service in production,
 * falls back to public API URL or localhost for development.
 */
export const API_BASE_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";
