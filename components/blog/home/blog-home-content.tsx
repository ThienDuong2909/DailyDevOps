'use client';

import { useEffect, useMemo, useState } from 'react';
import { BlogHero } from '@/components/blog/home/blog-hero';
import { BlogPostFeed } from '@/components/blog/home/blog-post-feed';
import { BlogTopics } from '@/components/blog/home/blog-topics';
import { NewsletterCta } from '@/components/blog/home/newsletter-cta';
import { TrendingToolsPanel } from '@/components/blog/home/trending-tools-panel';
import { useBlogPosts } from '@/hooks/use-blog-posts';
import { apiClient } from '@/lib/api';
import type { Category } from '@/types';

export function BlogHomeContent() {
    const [selectedTopic, setSelectedTopic] = useState('all');
    const [topics, setTopics] = useState<Array<{ label: string; value: string }>>([
        { label: 'All', value: 'all' },
    ]);
    const [isLoadingTopics, setIsLoadingTopics] = useState(true);
    const { featuredPost, isFallback, isLoading, posts } = useBlogPosts();

    useEffect(() => {
        let isMounted = true;

        const fetchTopics = async () => {
            try {
                const response = await apiClient.get<{ data?: Category[] } | Category[]>('/api/v1/categories');
                const categories = Array.isArray(response)
                    ? response
                    : Array.isArray(response?.data)
                      ? response.data
                      : [];

                if (!isMounted || categories.length === 0) {
                    return;
                }

                setTopics([
                    { label: 'All', value: 'all' },
                    ...categories.map((category) => ({
                        label: category.name,
                        value: category.slug,
                    })),
                ]);
            } catch {
                if (!isMounted) {
                    return;
                }

                setTopics([{ label: 'All', value: 'all' }]);
            } finally {
                if (isMounted) {
                    setIsLoadingTopics(false);
                }
            }
        };

        void fetchTopics();

        return () => {
            isMounted = false;
        };
    }, []);

    const feedPosts = useMemo(() => {
        const remainingPosts = featuredPost
            ? posts.filter((post) => post.id !== featuredPost.id)
            : posts;

        if (selectedTopic === 'all') {
            return remainingPosts;
        }

        return remainingPosts.filter(
            (post) =>
                post.category?.slug === selectedTopic ||
                post.category?.name?.toLowerCase() === selectedTopic.toLowerCase()
        );
    }, [featuredPost, posts, selectedTopic]);

    return (
        <div className="flex w-full max-w-[1280px] flex-col gap-8">
            <BlogHero isLoading={isLoading} post={featuredPost} />
            <BlogTopics
                isLoading={isLoadingTopics}
                onSelect={setSelectedTopic}
                selectedTopic={selectedTopic}
                topics={topics}
            />
            <div className="flex flex-col gap-8 lg:flex-row">
                <div className="flex-1">
                    <BlogPostFeed
                        isFallback={isFallback}
                        isLoading={isLoading}
                        posts={feedPosts}
                    />
                </div>
                <TrendingToolsPanel />
            </div>
            <NewsletterCta />
        </div>
    );
}
