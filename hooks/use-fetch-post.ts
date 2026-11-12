"use client";

import { useEffect, useRef, useState } from "react";
import type { AxiosError } from "axios";
import { useLocale } from "@/components/i18n/locale-provider";
import { apiClient } from "@/lib/api";
import type { SiteLocale } from "@/lib/i18n/config";
import { normalizeLocale } from "@/lib/i18n/config";
import { unwrap } from "@/lib/utils";
import type { Post, PostWithComments } from "@/types";

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
  const lastInitialPostRef = useRef(initialData?.post);
  const lastLocaleRef = useRef(locale);
  const lastSlugRef = useRef(slug);

  useEffect(() => {
    const initialPostChanged = initialData?.post !== lastInitialPostRef.current;
    const localeChanged = locale !== lastLocaleRef.current;
    const slugChanged = slug !== lastSlugRef.current;
    lastInitialPostRef.current = initialData?.post;
    lastLocaleRef.current = locale;
    lastSlugRef.current = slug;

    if (
      initialData?.post &&
      (initialPostChanged || (!localeChanged && !slugChanged))
    ) {
      setPost(initialData.post);
      setRelatedPosts(
        initialData.relatedPosts
          ? sortPostsNewestFirst(initialData.relatedPosts)
          : [],
      );
      setPopularPosts(initialData.popularPosts?.slice(0, 4) || []);
      setErrorMessage("");
      setTranslationNotice(null);
      setLoading(false);
      return;
    }

    let active = true;

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
        if (!active) return;
        setPost(postData);
        const [relatedRes, popularRes] = await Promise.all([
          apiClient.get(
            `/api/v1/posts/${postData.id}/related?limit=3&locale=${locale}`,
          ),
          apiClient.get(
            `/api/v1/posts/published?limit=5&sortBy=viewCount&sortOrder=desc&locale=${locale}`,
          ),
        ]);
        if (!active) return;
        setRelatedPosts(sortPostsNewestFirst(unwrap<Post[]>(relatedRes, [])));
        setPopularPosts(
          unwrap<Post[]>(popularRes, [])
            .filter((item) => item.slug !== postData.slug)
            .slice(0, 4),
        );
      } catch (error) {
        if (!active) return;
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
        if (active) {
          setLoading(false);
        }
      }
    };
    if (slug) void fetchData();

    return () => {
      active = false;
    };
  }, [
    initialData?.popularPosts,
    initialData?.post,
    initialData?.relatedPosts,
    locale,
    slug,
  ]);

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
