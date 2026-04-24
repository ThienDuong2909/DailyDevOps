"use client";

import { useEffect, useRef, useState } from "react";
import type { AxiosError } from "axios";
import { useLocale } from "@/components/i18n/locale-provider";
import { apiClient } from "@/lib/api";
import type { SiteLocale } from "@/lib/i18n/config";
import { normalizeLocale } from "@/lib/i18n/config";
import type { Post, PostWithComments } from "@/types";

function unwrap<T>(payload: unknown, fallback: T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return ((payload as { data?: T }).data ?? fallback) as T;
  }
  return (payload as T) ?? fallback;
}

export function sortPostsNewestFirst(posts: Post[]) {
  return [...posts].sort(
    (left, right) =>
      new Date(right.publishedAt || right.createdAt).getTime() -
      new Date(left.publishedAt || left.createdAt).getTime(),
  );
}

/**
 * Fetches post data by slug, with optional SSR initial data to skip
 * the first client-side fetch (hybrid SSR pattern).
 */
export function useFetchPostData(
  slug: string,
  initialData?: {
    post?: PostWithComments | null;
    relatedPosts?: Post[];
    popularPosts?: Post[];
  },
) {
  const hasInitialData = !!initialData?.post;
  const [post, setPost] = useState<PostWithComments | null>(
    initialData?.post || null,
  );
  const [relatedPosts, setRelatedPosts] = useState<Post[]>(
    initialData?.relatedPosts
      ? sortPostsNewestFirst(initialData.relatedPosts)
      : [],
  );
  const [popularPosts, setPopularPosts] = useState<Post[]>(
    initialData?.popularPosts?.slice(0, 4) || [],
  );
  const [loading, setLoading] = useState(!hasInitialData);
  const [errorMessage, setErrorMessage] = useState("");
  const [translationNotice, setTranslationNotice] = useState<{
    locale: SiteLocale;
    sourceLocale: SiteLocale;
    sourceSlug: string;
  } | null>(null);
  const locale = useLocale();
  const hasSkippedInitialFetch = useRef(hasInitialData);

  useEffect(() => {
    // Skip the first client-side fetch when we have SSR data
    if (hasSkippedInitialFetch.current) {
      hasSkippedInitialFetch.current = false;
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        setTranslationNotice(null);
        const postRes = await apiClient.get(
          `/api/v1/posts/slug/${slug}?locale=${locale}`,
        );
        const postData = unwrap<PostWithComments | null>(postRes, null);
        if (!postData) throw new Error("missing post");
        setPost(postData);
        const [relatedRes, popularRes] = await Promise.all([
          apiClient.get(
            `/api/v1/posts/${postData.id}/related?limit=3&locale=${locale}`,
          ),
          apiClient.get(
            `/api/v1/posts/published?limit=5&sortBy=viewCount&sortOrder=desc&locale=${locale}`,
          ),
        ]);
        setRelatedPosts(sortPostsNewestFirst(unwrap<Post[]>(relatedRes, [])));
        setPopularPosts(
          unwrap<Post[]>(popularRes, [])
            .filter((item) => item.slug !== postData.slug)
            .slice(0, 4),
        );
      } catch (error) {
        const apiError = error as AxiosError<{
          details?: {
            code?: string;
            locale?: string;
            sourceLocale?: string;
            sourceSlug?: string;
          };
        }>;
        const details = apiError.response?.data?.details;
        if (details?.code === "TRANSLATION_NOT_FOUND" && details.sourceSlug) {
          setTranslationNotice({
            locale: normalizeLocale(details.locale || locale),
            sourceLocale: normalizeLocale(details.sourceLocale || "vi"),
            sourceSlug: details.sourceSlug,
          });
          setErrorMessage("");
        } else {
          setErrorMessage("Khong the tai bai viet nay luc nay.");
        }
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchData();
  }, [locale, slug]);

  return {
    post,
    setPost,
    relatedPosts,
    popularPosts,
    loading,
    errorMessage,
    translationNotice,
  };
}
