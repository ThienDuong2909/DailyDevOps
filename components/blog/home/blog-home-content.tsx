'use client';

import { useMemo, useState } from 'react';
import { BlogHero } from '@/components/blog/home/blog-hero';
import { BlogPostFeed } from '@/components/blog/home/blog-post-feed';
import { BlogTopics } from '@/components/blog/home/blog-topics';
import { NewsletterCta } from '@/components/blog/home/newsletter-cta';
import { TrendingToolsPanel } from '@/components/blog/home/trending-tools-panel';
import { useBlogPosts } from '@/hooks/use-blog-posts';
import { blogTopics } from '@/lib/constants/blog';

export function BlogHomeContent() {
    const [selectedTopic, setSelectedTopic] = useState('All');
    const { featuredPost, isFallback, isLoading, posts } = useBlogPosts();
    const feedPosts = useMemo(() => {
        const remainingPosts = posts.slice(1);

        if (selectedTopic === 'All') {
            return remainingPosts;
        }

        return remainingPosts.filter((post) =>
            post.category?.name
                ?.toLowerCase()
                .includes(selectedTopic.toLowerCase())
        );
    }, [posts, selectedTopic]);

    return (
        <div className="flex w-full max-w-[1280px] flex-col gap-8">
            <BlogHero post={featuredPost} />
            <BlogTopics
                onSelect={setSelectedTopic}
                selectedTopic={selectedTopic}
                topics={blogTopics}
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
