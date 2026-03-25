'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';
import { samplePosts } from '@/lib/constants/blog';
import type { Post } from '@/types';

interface UseBlogPostsResult {
    featuredPost: Post | null;
    posts: Post[];
    isFallback: boolean;
    isLoading: boolean;
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
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFallback, setIsFallback] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchPosts = async () => {
            try {
                const response = await apiClient.get<unknown>(
                    '/api/v1/posts/published?limit=12&sortBy=publishedAt&sortOrder=asc'
                );
                const resolvedPosts = extractPosts(response);

                if (!isMounted) {
                    return;
                }

                if (resolvedPosts.length > 0) {
                    setPosts(resolvedPosts);
                    setIsFallback(false);
                    return;
                }

                setPosts(samplePosts);
                setIsFallback(true);
            } catch {
                if (!isMounted) {
                    return;
                }

                setPosts(samplePosts);
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
    }, []);

    const featuredPost = useMemo(() => posts[0] ?? null, [posts]);

    return {
        featuredPost,
        posts,
        isFallback,
        isLoading,
    };
}
