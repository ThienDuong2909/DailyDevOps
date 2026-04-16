'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from '@/components/i18n/locale-provider';
import { apiClient } from '@/lib/api';
import type { Post } from '@/types';

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
        (left, right) => toSortableTimestamp(right) - toSortableTimestamp(left)
    );
}

function extractPosts(payload: unknown): Post[] {
    if (Array.isArray(payload)) {
        return payload as Post[];
    }

    if (payload && typeof payload === 'object' && 'data' in payload) {
        const nested = (payload as { data?: unknown }).data;
        return Array.isArray(nested) ? (nested as Post[]) : [];
    }

    return [];
}

export function useBlogPosts(): UseBlogPostsResult {
    const locale = useLocale();
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFallback, setIsFallback] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchPosts = async () => {
            try {
                const response = await apiClient.get<unknown>(
                    `/api/v1/posts/published?limit=12&sortBy=publishedAt&sortOrder=desc&locale=${locale}`
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
    }, [locale]);

    const featuredPost = useMemo(() => posts[0] ?? null, [posts]);

    return {
        featuredPost,
        posts,
        isFallback,
        isLoading,
    };
}
