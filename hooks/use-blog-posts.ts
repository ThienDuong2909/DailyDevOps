"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { apiClient } from "@/lib/api";
import type { Post } from "@/types";

interface UseBlogPostsResult {
  featuredPost: Post | null;
  posts: Post[];
  isFallback: boolean;
  isLoading: boolean;
}

function toSortableTimestamp(post: Post): number {
  const candidate = post.publishedAt ?? post.createdAt ?? post.updatedAt;
  if (!candidate) {
    return 0;
  }

  const parsed = new Date(candidate).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortPostsNewestFirst(posts: Post[]): Post[] {
  return [...posts].sort(
    (left, right) => toSortableTimestamp(right) - toSortableTimestamp(left),
  );
}

function extractPosts(payload: unknown): Post[] {
  if (Array.isArray(payload)) {
    return payload as Post[];
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const nested = (payload as { data?: unknown }).data;
    return Array.isArray(nested) ? (nested as Post[]) : [];
  }

  return [];
}

export function useBlogPosts(initialPosts?: Post[]): UseBlogPostsResult {
  const locale = useLocale();
  const hasInitial = Array.isArray(initialPosts) && initialPosts.length > 0;
  const [posts, setPosts] = useState<Post[]>(
    hasInitial ? sortPostsNewestFirst(initialPosts) : [],
  );
  const [isLoading, setIsLoading] = useState(!hasInitial);
  const [isFallback, setIsFallback] = useState(false);
  const lastLocaleRef = useRef(locale);
  const lastInitialPostsRef = useRef(initialPosts);

  useEffect(() => {
    const initialChanged = initialPosts !== lastInitialPostsRef.current;
    const localeChanged = locale !== lastLocaleRef.current;
    lastInitialPostsRef.current = initialPosts;
    lastLocaleRef.current = locale;

    if (
      initialChanged &&
      Array.isArray(initialPosts) &&
      initialPosts.length > 0
    ) {
      setPosts(sortPostsNewestFirst(initialPosts));
      setIsFallback(false);
      setIsLoading(false);
      return;
    }

    if (
      !localeChanged &&
      Array.isArray(initialPosts) &&
      initialPosts.length > 0
    ) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchPosts = async () => {
      try {
        const response = await apiClient.get<unknown>(
          `/api/v1/posts/published?limit=12&sortBy=publishedAt&sortOrder=desc&locale=${locale}`,
        );
        const resolvedPosts = sortPostsNewestFirst(extractPosts(response));

        if (!isMounted) {
          return;
        }

        if (resolvedPosts.length > 0) {
          setPosts(resolvedPosts);
          setIsFallback(false);
          return;
        }

        setPosts([]);
        setIsFallback(false);
      } catch {
        if (!isMounted) {
          return;
        }

        setPosts([]);
        setIsFallback(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, [initialPosts, locale]);

  const featuredPost = useMemo(() => posts[0] ?? null, [posts]);

  return {
    featuredPost,
    posts,
    isFallback,
    isLoading,
  };
}
