/**
 * Server-side data fetchers for Next.js server components.
 * These use `fetch()` with ISR revalidation — NOT axios (which is client-only).
 */
import { API_BASE_URL } from "@/lib/constants/site";
import type { Category, Post, Tag } from "@/types";

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

function stripSummaryPost<T>(post: T): T {
  if (!post || typeof post !== "object") return post;
  return {
    ...post,
    content: "",
    contentHtml: "",
    contentJson: null,
  };
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
    const raw = json.data || [];
    return Array.isArray(raw) ? raw.map(stripSummaryPost) : [];
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
    return Array.isArray(posts) ? posts.map(stripSummaryPost) : [];
  } catch {
    return [];
  }
}

/**
 * Fetch latest published posts for homepage display.
 */
export async function fetchPublishedPosts(locale: string, limit = 12) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/posts/published?limit=${limit}&sortBy=publishedAt&sortOrder=desc&locale=${locale}`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    const posts = json.data?.data || json.data || [];
    return Array.isArray(posts) ? posts.map(stripSummaryPost) : [];
  } catch {
    return [];
  }
}

/**
 * Fetch all categories with 1-hour ISR revalidation.
 */
export async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/categories`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

/**
 * Fetch a single category by slug.
 */
export async function fetchCategoryBySlug(slug: string) {
  try {
    const categories = await fetchCategories();
    return (
      categories.find((cat: { slug: string }) => cat.slug === slug) || null
    );
  } catch {
    return null;
  }
}

/**
 * Fetch published posts for a specific category by slug or ID.
 */
export async function fetchPostsByCategory(
  categorySlugOrId: string,
  locale = "vi",
  limit = 20,
) {
  try {
    const isId = /^[0-9a-fA-F-]{36}$/.test(categorySlugOrId);
    const param = isId
      ? `categoryId=${encodeURIComponent(categorySlugOrId)}`
      : `categorySlug=${encodeURIComponent(categorySlugOrId)}`;

    const res = await fetch(
      `${API_BASE_URL}/api/v1/posts/published?${param}&limit=${limit}&sortBy=publishedAt&sortOrder=desc&locale=${locale}`,
      { next: { revalidate: 300 } },
    );

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    const posts = json.data?.data || json.data || [];
    return Array.isArray(posts) ? posts.map(stripSummaryPost) : [];
  } catch {
    return [];
  }
}

export type ListingSortOption = "latest" | "popular" | "oldest";

function getSortParams(sort: ListingSortOption) {
  switch (sort) {
    case "popular":
      return { sortBy: "viewCount", sortOrder: "desc" };
    case "oldest":
      return { sortBy: "publishedAt", sortOrder: "asc" };
    default:
      return { sortBy: "publishedAt", sortOrder: "desc" };
  }
}

/**
 * Fetch paginated published posts (optionally filtered by categorySlug) for SSR listing pages.
 */
export async function fetchPublishedPostsPaginated({
  locale = "vi",
  categorySlug,
  page = 1,
  limit = 12,
  sort = "latest",
}: {
  locale?: string;
  categorySlug?: string;
  page?: number;
  limit?: number;
  sort?: ListingSortOption;
} = {}): Promise<{ posts: Post[]; total: number; totalPages: number } | null> {
  try {
    const { sortBy, sortOrder } = getSortParams(sort);
    const params = new URLSearchParams({
      limit: String(limit),
      page: String(page),
      sortBy,
      sortOrder,
      locale,
    });

    if (categorySlug && categorySlug !== "all") {
      params.set("categorySlug", categorySlug);
    }

    const res = await fetch(
      `${API_BASE_URL}/api/v1/posts/published?${params.toString()}`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    const payload = json?.data ?? json;
    const rawPosts = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
    const meta = !Array.isArray(payload) ? payload?.meta : json?.meta;
    const posts = rawPosts.map((post: Post) => stripSummaryPost(post));

    return {
      posts,
      total: typeof meta?.total === "number" ? meta.total : posts.length,
      totalPages:
        typeof meta?.totalPages === "number" ? Math.max(1, meta.totalPages) : 1,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch top tags for listing sidebar tag cloud.
 */
export async function fetchTags(limit = 14): Promise<Tag[] | undefined> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/tags`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return undefined;
    }

    const json = await res.json();
    const rawTags = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
        ? json.data
        : [];

    return (rawTags as Tag[])
      .filter((t) => (t._count?.posts ?? 0) > 0)
      .sort((a, b) => (b._count?.posts ?? 0) - (a._count?.posts ?? 0))
      .slice(0, limit);
  } catch {
    return undefined;
  }
}

/**
 * Fetch consolidated lightweight listing data for /category and /category/[slug].
 */
export async function fetchCategoryListingData({
  locale = "vi",
  categorySlug,
  page = 1,
  sort = "latest",
  skipPosts = false,
}: {
  locale?: string;
  categorySlug?: string;
  page?: number;
  sort?: ListingSortOption;
  skipPosts?: boolean;
}) {
  const [paginated, categories, popularPosts, tags] = await Promise.all([
    skipPosts
      ? Promise.resolve(null)
      : fetchPublishedPostsPaginated({
          locale,
          categorySlug,
          page,
          limit: 12,
          sort,
        }),
    fetchCategories() as Promise<Category[]>,
    fetchPopularPosts(locale, 5) as Promise<Post[]>,
    fetchTags(14),
  ]);

  return {
    initialPosts: paginated?.posts,
    initialTotalPosts: paginated?.total,
    initialTotalPages: paginated?.totalPages,
    initialCategories: categories.length > 0 ? categories : undefined,
    initialPopularPosts: popularPosts
      .filter((post) => (post.viewCount ?? 0) > 0)
      .slice(0, 5),
    initialTags: tags,
  };
}
