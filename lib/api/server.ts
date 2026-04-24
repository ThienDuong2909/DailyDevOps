/**
 * Server-side data fetchers for Next.js server components.
 * These use `fetch()` with ISR revalidation — NOT axios (which is client-only).
 */
import { API_BASE_URL } from "@/lib/constants/site";

/**
 * Fetch a single post by slug for server-side rendering.
 * Uses ISR with 1-hour revalidation.
 */
export async function fetchPostBySlug(slug: string, locale: string) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/posts/slug/${slug}?locale=${locale}`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

/**
 * Fetch related posts for a given post ID.
 */
export async function fetchRelatedPosts(
  postId: string,
  locale: string,
  limit = 3,
) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/posts/${postId}/related?limit=${limit}&locale=${locale}`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

/**
 * Fetch popular posts for sidebar display.
 */
export async function fetchPopularPosts(locale: string, limit = 5) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/posts/published?limit=${limit}&sortBy=viewCount&sortOrder=desc&locale=${locale}`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    const posts = json.data?.data || json.data || [];
    return posts;
  } catch {
    return [];
  }
}
