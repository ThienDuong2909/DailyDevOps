"use client";

import { useEffect, useMemo, useState } from "react";
import { useDictionary, useLocale } from "@/components/i18n/locale-provider";
import { BlogHero } from "@/components/blog/home/blog-hero";
import { BlogPostFeed } from "@/components/blog/home/blog-post-feed";
import { BlogTopics } from "@/components/blog/home/blog-topics";
import { NewsletterCta } from "@/components/blog/home/newsletter-cta";
import { TrendingToolsPanel } from "@/components/blog/home/trending-tools-panel";
import { useBlogPosts } from "@/hooks/use-blog-posts";
import { apiClient } from "@/lib/api";
import type { Category, Post } from "@/types";

interface BlogHomeContentProps {
  initialPosts?: Post[];
  initialCategories?: Category[];
  initialPopularPosts?: Post[];
}

export function BlogHomeContent({
  initialPosts,
  initialCategories,
  initialPopularPosts,
}: BlogHomeContentProps = {}) {
  const locale = useLocale();
  const dictionary = useDictionary();
  const [selectedTopic, setSelectedTopic] = useState("all");
  const hasInitialCategories =
    Array.isArray(initialCategories) && initialCategories.length > 0;
  const [categories, setCategories] = useState<Category[]>(() =>
    hasInitialCategories ? initialCategories : [],
  );
  const [isLoadingTopics, setIsLoadingTopics] = useState(!hasInitialCategories);
  const { featuredPost, isFallback, isLoading, posts } =
    useBlogPosts(initialPosts);

  useEffect(() => {
    if (Array.isArray(initialCategories) && initialCategories.length > 0) {
      setCategories(initialCategories);
      setIsLoadingTopics(false);
    }
  }, [initialCategories]);

  useEffect(() => {
    if (hasInitialCategories) {
      return;
    }

    let isMounted = true;

    const fetchTopics = async () => {
      try {
        const response = await apiClient.get<
          { data?: Category[] } | Category[]
        >("/api/v1/categories");
        const nextCategories = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        if (!isMounted || nextCategories.length === 0) {
          return;
        }

        setCategories(nextCategories);
      } catch {
        if (!isMounted) {
          return;
        }

        setCategories([]);
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
  }, [hasInitialCategories]);

  const topics = useMemo(
    () => [
      { label: dictionary.common.allArticles, value: "all" },
      ...categories.map((category) => ({
        label: category.name,
        value: category.slug,
      })),
    ],
    [categories, dictionary.common.allArticles],
  );

  const feedPosts = useMemo(() => {
    const remainingPosts = featuredPost
      ? posts.filter((post) => post.id !== featuredPost.id)
      : posts;

    if (selectedTopic === "all") {
      return remainingPosts;
    }

    return remainingPosts.filter(
      (post) =>
        post.category?.slug === selectedTopic ||
        post.category?.name?.toLowerCase() === selectedTopic.toLowerCase(),
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
        <TrendingToolsPanel initialPopularPosts={initialPopularPosts} />
      </div>
      <NewsletterCta />
    </div>
  );
}
