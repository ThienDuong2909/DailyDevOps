"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Tag as TagIcon,
  Folder,
  Clock,
  ArrowUpDown,
  Check,
} from "lucide-react";
import { PostCard } from "@/components/blog/post-card";
import { useLocale } from "@/components/i18n/locale-provider";
import { withLocale } from "@/lib/i18n/config";
import {
  getSearchEngine,
  loadSearchIndex,
  SearchPostItem,
  SearchCategoryItem,
  SearchTagItem,
} from "@/lib/search/search-engine";
import { trackSearch } from "@/lib/analytics";
import type { Post } from "@/types";

const POSTS_PER_PAGE = 12;

const TRENDING_TOPICS = [
  "Docker",
  "Kubernetes",
  "CI/CD",
  "Terraform",
  "Prometheus",
  "Linux",
  "Monitoring",
  "Microservices",
];

type SortMode = "relevance" | "latest" | "oldest";

function searchItemToPost(item: SearchPostItem): Post {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    featuredImage: item.featuredImage || undefined,
    category: item.category
      ? {
          id: item.category.slug,
          name: item.category.name,
          slug: item.category.slug,
          color: item.category.color || "#137fec",
        }
      : undefined,
    tags: (item.tags || []).map((t) => ({ id: t, name: t, slug: t })),
    publishedAt: item.publishedAt || undefined,
    author: {
      id: "devops-daily",
      firstName: "DevOps",
      lastName: "Daily",
    },
    viewCount: 0,
    readingTime: 5,
    status: "PUBLISHED" as const,
    content: "",
  } as unknown as Post;
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();

  // Query params
  const qParam = searchParams.get("q")?.trim() || "";
  const categoryParam = searchParams.get("category")?.trim() || "";
  const tagParam = searchParams.get("tag")?.trim() || "";
  const sortParam = (searchParams.get("sort")?.trim() ||
    (qParam ? "relevance" : "latest")) as SortMode;
  const pageParam = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10) || 1,
  );

  // Local input state for smooth typing
  const [inputValue, setInputValue] = useState(qParam);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Micro-index loaded data
  const [allPosts, setAllPosts] = useState<SearchPostItem[]>([]);
  const [allCategories, setAllCategories] = useState<SearchCategoryItem[]>([]);
  const [allTags, setAllTags] = useState<SearchTagItem[]>([]);

  // Translations
  const isEn = locale === "en";
  const text = isEn
    ? {
        label: "Smart Search",
        heading: "DevOps Knowledge Base",
        subtitle:
          "Search through guides, architectures, production incidents, and platform tooling.",
        placeholder: "Search Kubernetes, Docker, CI/CD, Terraform...",
        searchBtn: "Search",
        filtersTitle: "Filters",
        resetFilters: "Reset filters",
        allCategories: "All Categories",
        categories: "Categories",
        popularTags: "Tags",
        sortBy: "Sort by",
        sortRelevance: "Relevance",
        sortLatest: "Newest First",
        sortOldest: "Oldest First",
        resultsFound: (n: number, q: string) =>
          q
            ? `Found ${n} article${n === 1 ? "" : "s"} for "${q}"`
            : `Showing ${n} article${n === 1 ? "" : "s"}`,
        noResultsTitle: "No articles found",
        noResultsDesc:
          "Try checking your spelling, removing filters, or searching for a broader DevOps topic.",
        trendingLabel: "Popular Topics:",
        trendingPillsTitle: "Explore popular topics",
        filterByTag: "Tag",
        filterByCategory: "Category",
        clearTag: "Remove tag",
        clearCategory: "Remove category",
        page: "Page",
        prev: "Previous",
        next: "Next",
      }
    : {
        label: "Tìm kiếm thông minh",
        heading: "Kho tri thức DevOps & Cloud",
        subtitle:
          "Tra cứu cẩm nang thực chiến, kiến trúc hệ thống, CI/CD và giải quyết sự cố production.",
        placeholder: "Tìm kiếm Docker, Kubernetes, CI/CD, Terraform...",
        searchBtn: "Tìm kiếm",
        filtersTitle: "Bộ lọc bài viết",
        resetFilters: "Đặt lại bộ lọc",
        allCategories: "Tất cả chuyên mục",
        categories: "Chuyên mục",
        popularTags: "Thẻ bài viết (Tags)",
        sortBy: "Sắp xếp theo",
        sortRelevance: "Độ liên quan",
        sortLatest: "Mới nhất",
        sortOldest: "Cũ nhất",
        resultsFound: (n: number, q: string) =>
          q ? `Tìm thấy ${n} bài viết cho "${q}"` : `Tổng cộng ${n} bài viết`,
        noResultsTitle: "Không tìm thấy bài viết phù hợp",
        noResultsDesc:
          "Hãy thử kiểm tra lại từ khóa, xóa bớt bộ lọc, hoặc khám phá các chủ đề phổ biến bên dưới.",
        trendingLabel: "Chủ đề thịnh hành:",
        trendingPillsTitle: "Khám phá các chủ đề phổ biến",
        filterByTag: "Thẻ",
        filterByCategory: "Chuyên mục",
        clearTag: "Bỏ chọn thẻ",
        clearCategory: "Bỏ chọn chuyên mục",
        page: "Trang",
        prev: "Trang trước",
        next: "Trang sau",
      };

  // Keep local input in sync when URL changes externally
  useEffect(() => {
    setInputValue(qParam);
  }, [qParam]);

  // Load search index on mount / locale change
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    loadSearchIndex(locale)
      .then((engine) => {
        if (!isMounted) return;
        setAllPosts(engine.getAllPosts());
        setAllCategories(engine.getAllCategories());
        setAllTags(engine.getAllTags());
      })
      .catch((err) => {
        console.error("[SearchPage] Failed to load index:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [locale]);

  // Push URL changes
  const updateSearch = useCallback(
    (updates: {
      q?: string | null;
      category?: string | null;
      tag?: string | null;
      sort?: string | null;
      page?: number | null;
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      // Handle q
      if (updates.q !== undefined) {
        if (updates.q && updates.q.trim()) {
          params.set("q", updates.q.trim());
        } else {
          params.delete("q");
        }
      }

      // Handle category
      if (updates.category !== undefined) {
        if (updates.category) {
          params.set("category", updates.category);
        } else {
          params.delete("category");
        }
      }

      // Handle tag
      if (updates.tag !== undefined) {
        if (updates.tag) {
          params.set("tag", updates.tag);
        } else {
          params.delete("tag");
        }
      }

      // Handle sort
      if (updates.sort !== undefined) {
        if (
          updates.sort &&
          updates.sort !== "latest" &&
          updates.sort !== "relevance"
        ) {
          params.set("sort", updates.sort);
        } else if (updates.sort) {
          params.set("sort", updates.sort);
        } else {
          params.delete("sort");
        }
      }

      // Handle page (reset to 1 on filter/query changes unless explicitly set)
      if (updates.page !== undefined) {
        if (updates.page && updates.page > 1) {
          params.set("page", String(updates.page));
        } else {
          params.delete("page");
        }
      } else if (
        updates.q !== undefined ||
        updates.category !== undefined ||
        updates.tag !== undefined ||
        updates.sort !== undefined
      ) {
        params.delete("page");
      }

      const queryString = params.toString();
      const targetUrl = queryString
        ? `${withLocale("/search", locale)}?${queryString}`
        : withLocale("/search", locale);

      router.push(targetUrl, { scroll: false });
    },
    [locale, router, searchParams],
  );

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearch({ q: inputValue });
  };

  // Perform Smart In-Memory Search
  const matchedPosts = useMemo(() => {
    if (!qParam) {
      return allPosts;
    }
    const engine = getSearchEngine();
    if (!engine.isReady()) {
      return allPosts;
    }
    const res = engine.search(qParam, { limit: 1000 });
    return res.posts;
  }, [allPosts, qParam]);

  // Calculate dynamic facet counts based on matchedPosts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const post of matchedPosts) {
      if (post.category?.slug) {
        counts[post.category.slug] = (counts[post.category.slug] || 0) + 1;
      }
    }
    return counts;
  }, [matchedPosts]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const post of matchedPosts) {
      if (post.tags) {
        for (const t of post.tags) {
          counts[t.toLowerCase()] = (counts[t.toLowerCase()] || 0) + 1;
        }
      }
    }
    return counts;
  }, [matchedPosts]);

  // Filter by category & tag
  const filteredPosts = useMemo(() => {
    let result = matchedPosts;

    if (categoryParam) {
      result = result.filter((post) => post.category?.slug === categoryParam);
    }

    if (tagParam) {
      const targetTag = tagParam.toLowerCase();
      result = result.filter((post) =>
        post.tags?.some((t) => t.toLowerCase() === targetTag),
      );
    }

    // Sort
    if (sortParam === "latest") {
      result = [...result].sort((a, b) => {
        const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return timeB - timeA;
      });
    } else if (sortParam === "oldest") {
      result = [...result].sort((a, b) => {
        const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return timeA - timeB;
      });
    } else if (sortParam === "relevance" && !qParam) {
      // Default when no query is newest
      result = [...result].sort((a, b) => {
        const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return timeB - timeA;
      });
    }

    return result;
  }, [categoryParam, matchedPosts, qParam, sortParam, tagParam]);

  // Track search analytics
  useEffect(() => {
    if (qParam && !isLoading) {
      trackSearch(qParam, filteredPosts.length);
    }
  }, [filteredPosts.length, isLoading, qParam]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPosts.length / POSTS_PER_PAGE),
  );
  const currentPage = Math.min(pageParam, totalPages);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return filteredPosts.slice(start, start + POSTS_PER_PAGE);
  }, [currentPage, filteredPosts]);

  const hasActiveFilters = Boolean(
    categoryParam ||
    tagParam ||
    (sortParam !== "relevance" && sortParam !== "latest"),
  );

  return (
    <div className="flex w-full flex-col gap-8 pb-16">
      {/* ── Search Hero Section ── */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border-theme)] bg-[var(--surface-elevated)] p-6 shadow-sm md:p-10">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" />
              {text.label}
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-[var(--text-main-theme)] sm:text-4xl">
              {text.heading}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted-theme)] sm:text-base">
              {text.subtitle}
            </p>
          </div>

          {/* Search Input Bar */}
          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="relative flex flex-1 items-center">
              <Search className="absolute left-4 size-5 text-[var(--text-muted-theme)]" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={text.placeholder}
                className="w-full rounded-2xl border border-[var(--border-theme)] bg-[var(--surface-main)] py-3.5 pl-12 pr-12 text-sm text-[var(--text-main-theme)] placeholder-[var(--text-muted-theme)] transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 sm:text-base"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => {
                    setInputValue("");
                    updateSearch({ q: "" });
                  }}
                  className="absolute right-4 rounded-lg p-1 text-[var(--text-muted-theme)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-main-theme)]"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="inline-flex h-[52px] items-center justify-center rounded-2xl bg-primary px-8 text-sm font-bold text-white shadow-md shadow-primary/25 transition-all hover:bg-blue-600 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
            >
              {text.searchBtn}
            </button>
          </form>

          {/* Trending keywords quick pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[var(--text-muted-theme)]">
            <span className="font-semibold text-[var(--text-main-theme)]">
              {text.trendingLabel}
            </span>
            {TRENDING_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => {
                  setInputValue(topic);
                  updateSearch({ q: topic });
                }}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--border-theme)] bg-[var(--surface-main)] px-3 py-1 font-medium text-[var(--text-main-theme)] transition-colors hover:border-primary hover:text-primary"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Active Filters & Mobile Filter Toggle ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-[var(--text-main-theme)]">
            {text.resultsFound(filteredPosts.length, qParam)}
          </p>

          {/* Active Category Chip */}
          {categoryParam && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              <Folder className="size-3" />
              {allCategories.find((c) => c.slug === categoryParam)?.name ||
                categoryParam}
              <button
                type="button"
                onClick={() => updateSearch({ category: null })}
                className="rounded-full p-0.5 hover:bg-primary/20"
                aria-label={text.clearCategory}
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {/* Active Tag Chip */}
          {tagParam && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <TagIcon className="size-3" />#{tagParam}
              <button
                type="button"
                onClick={() => updateSearch({ tag: null })}
                className="rounded-full p-0.5 hover:bg-emerald-500/20"
                aria-label={text.clearTag}
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() =>
                updateSearch({
                  category: null,
                  tag: null,
                  sort: qParam ? "relevance" : "latest",
                })
              }
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted-theme)] hover:text-rose-500"
            >
              <RotateCcw className="size-3" />
              {text.resetFilters}
            </button>
          )}
        </div>

        {/* Mobile Filter Drawer Button */}
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-theme)] bg-[var(--surface-elevated)] px-4 py-2 text-xs font-bold text-[var(--text-main-theme)] lg:hidden"
        >
          <SlidersHorizontal className="size-3.5" />
          {text.filtersTitle}
          {hasActiveFilters && (
            <span className="size-2 rounded-full bg-primary" />
          )}
        </button>
      </div>

      {/* ── Main 2-Column Section ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        {/* ── Left Sidebar (Filters) ── */}
        <aside
          className={`flex-col gap-6 lg:flex ${
            mobileFiltersOpen ? "flex" : "hidden"
          }`}
        >
          <div className="sticky top-24 flex flex-col gap-6 rounded-2xl border border-[var(--border-theme)] bg-[var(--surface-elevated)] p-6 shadow-sm">
            {/* Sort selector */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted-theme)]">
                <ArrowUpDown className="size-3.5" />
                {text.sortBy}
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                {[
                  {
                    mode: "relevance" as const,
                    label: text.sortRelevance,
                    show: Boolean(qParam),
                  },
                  {
                    mode: "latest" as const,
                    label: text.sortLatest,
                    show: true,
                  },
                  {
                    mode: "oldest" as const,
                    label: text.sortOldest,
                    show: true,
                  },
                ]
                  .filter((item) => item.show)
                  .map((item) => {
                    const isSelected = sortParam === item.mode;
                    return (
                      <button
                        key={item.mode}
                        type="button"
                        onClick={() => updateSearch({ sort: item.mode })}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-primary text-white font-semibold"
                            : "text-[var(--text-main-theme)] hover:bg-[var(--surface-muted)]"
                        }`}
                      >
                        <span>{item.label}</span>
                        {isSelected && <Check className="size-3.5" />}
                      </button>
                    );
                  })}
              </div>
            </div>

            <hr className="border-[var(--border-theme)]" />

            {/* Categories Filter */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-muted-theme)]">
                <span className="flex items-center gap-2">
                  <Folder className="size-3.5" />
                  {text.categories}
                </span>
                {categoryParam && (
                  <button
                    type="button"
                    onClick={() => updateSearch({ category: null })}
                    className="text-[11px] font-semibold text-primary hover:underline lowercase"
                  >
                    {text.resetFilters}
                  </button>
                )}
              </div>
              <div className="mt-3 flex max-h-60 flex-col gap-1 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => updateSearch({ category: null })}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                    !categoryParam
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-[var(--text-main-theme)] hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  <span>{text.allCategories}</span>
                  <span className="rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] text-[var(--text-muted-theme)]">
                    {matchedPosts.length}
                  </span>
                </button>
                {allCategories.map((category) => {
                  const isSelected = categoryParam === category.slug;
                  const count = categoryCounts[category.slug] || 0;
                  return (
                    <button
                      key={category.slug}
                      type="button"
                      onClick={() =>
                        updateSearch({
                          category: isSelected ? null : category.slug,
                        })
                      }
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                        isSelected
                          ? "bg-primary text-white font-semibold"
                          : count === 0
                            ? "text-[var(--text-muted-theme)] opacity-50 hover:bg-[var(--surface-muted)]"
                            : "text-[var(--text-main-theme)] hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      <span className="truncate pr-2">{category.name}</span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] ${
                          isSelected
                            ? "bg-white/20 text-white font-bold"
                            : "bg-[var(--surface-muted)] text-[var(--text-muted-theme)]"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-[var(--border-theme)]" />

            {/* Tags Filter */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-muted-theme)]">
                <span className="flex items-center gap-2">
                  <TagIcon className="size-3.5" />
                  {text.popularTags}
                </span>
                {tagParam && (
                  <button
                    type="button"
                    onClick={() => updateSearch({ tag: null })}
                    className="text-[11px] font-semibold text-primary hover:underline lowercase"
                  >
                    {text.resetFilters}
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
                {allTags.slice(0, 20).map((tag) => {
                  const isSelected =
                    tagParam.toLowerCase() === tag.name.toLowerCase();
                  const count = tagCounts[tag.name.toLowerCase()] || 0;
                  return (
                    <button
                      key={tag.slug || tag.name}
                      type="button"
                      onClick={() =>
                        updateSearch({ tag: isSelected ? null : tag.name })
                      }
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : count === 0
                            ? "border-[var(--border-theme)] bg-[var(--surface-muted)] text-[var(--text-muted-theme)] opacity-40"
                            : "border-[var(--border-theme)] bg-[var(--surface-main)] text-[var(--text-main-theme)] hover:border-primary hover:text-primary"
                      }`}
                    >
                      <span>#{tag.name}</span>
                      {count > 0 && (
                        <span className="text-[10px] opacity-75">
                          ({count})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Right Content: Results Grid & Empty State ── */}
        <main className="flex flex-col gap-8">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 animate-pulse rounded-2xl border border-[var(--border-theme)] bg-[var(--surface-elevated)]"
                />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border-theme)] bg-[var(--surface-elevated)] p-12 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Search className="size-8" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-[var(--text-main-theme)]">
                {text.noResultsTitle}
              </h3>
              <p className="mt-2 max-w-md text-sm text-[var(--text-muted-theme)]">
                {text.noResultsDesc}
              </p>

              <div className="mt-6 flex flex-col items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted-theme)]">
                  {text.trendingPillsTitle}
                </span>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                  {TRENDING_TOPICS.map((topic) => (
                    <button
                      key={`empty-${topic}`}
                      type="button"
                      onClick={() => {
                        setInputValue(topic);
                        updateSearch({
                          q: topic,
                          category: null,
                          tag: null,
                        });
                      }}
                      className="rounded-full border border-[var(--border-theme)] bg-[var(--surface-main)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-main-theme)] shadow-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Results Grid */
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedPosts.map((post) => (
                  <PostCard key={post.id} post={searchItemToPost(post)} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-[var(--border-theme)] bg-[var(--surface-elevated)] p-4 sm:flex-row">
                  <p className="text-xs text-[var(--text-muted-theme)]">
                    {text.page}{" "}
                    <span className="font-bold text-[var(--text-main-theme)]">
                      {currentPage}
                    </span>{" "}
                    / {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateSearch({ page: currentPage - 1 })}
                      disabled={currentPage <= 1}
                      className="rounded-xl border border-[var(--border-theme)] bg-[var(--surface-main)] px-3.5 py-2 text-xs font-semibold text-[var(--text-main-theme)] transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-[var(--border-theme)] disabled:hover:text-[var(--text-main-theme)]"
                    >
                      {text.prev}
                    </button>

                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const p = idx + 1;
                      // Show only pages near current page
                      if (
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 1
                      ) {
                        const isActive = p === currentPage;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => updateSearch({ page: p })}
                            className={`size-8 rounded-xl text-xs font-bold transition-colors ${
                              isActive
                                ? "bg-primary text-white shadow-sm"
                                : "border border-[var(--border-theme)] bg-[var(--surface-main)] text-[var(--text-main-theme)] hover:border-primary hover:text-primary"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      } else if (
                        (p === 2 && currentPage > 3) ||
                        (p === totalPages - 1 && currentPage < totalPages - 2)
                      ) {
                        return (
                          <span
                            key={`gap-${p}`}
                            className="px-1 text-xs text-[var(--text-muted-theme)]"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    <button
                      type="button"
                      onClick={() => updateSearch({ page: currentPage + 1 })}
                      disabled={currentPage >= totalPages}
                      className="rounded-xl border border-[var(--border-theme)] bg-[var(--surface-main)] px-3.5 py-2 text-xs font-semibold text-[var(--text-main-theme)] transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-[var(--border-theme)] disabled:hover:text-[var(--text-main-theme)]"
                    >
                      {text.next}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export function SearchPageClient() {
  return (
    <Suspense
      fallback={
        <div className="flex w-full flex-col gap-8 pb-16">
          <div className="h-64 animate-pulse rounded-3xl border border-[var(--border-theme)] bg-[var(--surface-elevated)]" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl border border-[var(--border-theme)] bg-[var(--surface-elevated)]"
              />
            ))}
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
