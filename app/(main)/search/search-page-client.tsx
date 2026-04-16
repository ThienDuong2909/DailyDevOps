'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { trackSearch } from '@/lib/analytics';
import { PostCard } from '@/components/blog/post-card';
import { useDictionary, useLocale } from '@/components/i18n/locale-provider';
import { withLocale } from '@/lib/i18n/config';
import type { Category, PaginatedResponse, Post } from '@/types';

const SEARCH_POSTS_PER_PAGE = 20;

type SearchPayload =
    | PaginatedResponse<Post>
    | { data?: PaginatedResponse<Post> | Post[] }
    | Post[];

function resolvePostsPayload(payload: SearchPayload) {
    if (Array.isArray(payload)) {
        return {
            data: payload,
            meta: {
                total: payload.length,
                page: 1,
                limit: payload.length || 10,
                totalPages: 1,
            },
        };
    }

    if (payload && typeof payload === 'object' && 'data' in payload) {
        const nestedData = payload.data;

        if (Array.isArray(nestedData)) {
            return {
                data: nestedData,
                meta: {
                    total: nestedData.length,
                    page: 1,
                    limit: nestedData.length || 10,
                    totalPages: 1,
                },
            };
        }

        if (nestedData && typeof nestedData === 'object' && 'meta' in nestedData) {
            return nestedData as PaginatedResponse<Post>;
        }
    }

    return payload as PaginatedResponse<Post>;
}

function SearchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = useLocale();
    const dictionary = useDictionary();
    const query = searchParams.get('q')?.trim() || '';
    const page = Number(searchParams.get('page') || '1');

    const [searchInput, setSearchInput] = useState(query);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [totalResults, setTotalResults] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
    const fallbackTopics = ['Kubernetes', 'CI/CD', 'Prometheus', 'Terraform', 'Monitoring'];
    const copy =
        locale === 'en'
            ? {
                  loadingError: 'Unable to load search results right now.',
                  intro: 'Search by technology, workflow, or incident theme to jump into the right articles faster.',
                  loading: (term: string) => `Searching for "${term}"...`,
                  results: (total: number, term: string) => `Found ${total} result${total === 1 ? '' : 's'} for "${term}"`,
                  label: 'Search',
                  title: 'Search the DevOps Daily library',
                  placeholder: 'Kubernetes, CI/CD, monitoring...',
                  tipsTitle: 'Search Tips',
                  startTitle: 'Start with a proven topic',
                  startBody: 'Use one of these entry points to quickly find articles that match your current task.',
                  emptyTitle: 'No matching articles yet',
                  emptyBody: 'Try a shorter query, switch to a related keyword, or jump into one of the suggested topics below.',
                  tips: [
                      'Search by a specific technology like `Terraform`, `Kubernetes`, or `Prometheus`.',
                      'Try workflow keywords like `CI/CD`, `incident`, `release`, or `monitoring`.',
                      'If results are too broad, shorten the query to the 1-2 most important terms.',
                  ],
              }
            : {
                  loadingError: 'Không thể tải kết quả tìm kiếm lúc này.',
                  intro: 'Tìm theo công nghệ, workflow hoặc chủ đề sự cố để đến đúng bài viết nhanh hơn.',
                  loading: (term: string) => `Đang tìm "${term}"...`,
                  results: (total: number, term: string) => `Tìm thấy ${total} kết quả cho "${term}"`,
                  label: dictionary.common.search,
                  title: 'Tìm trong thư viện Daily DevOps',
                  placeholder: 'Kubernetes, CI/CD, monitoring...',
                  tipsTitle: 'Mẹo tìm kiếm',
                  startTitle: 'Bắt đầu với một chủ đề phổ biến',
                  startBody: 'Dùng một trong các gợi ý dưới đây để tìm nhanh các bài viết phù hợp với nhu cầu hiện tại.',
                  emptyTitle: 'Chưa có bài viết phù hợp',
                  emptyBody: 'Hãy thử từ khóa ngắn hơn, đổi sang một chủ đề gần nghĩa, hoặc bắt đầu bằng các gợi ý bên dưới.',
                  tips: [
                      'Tìm theo công nghệ cụ thể như `Terraform`, `Kubernetes` hoặc `Prometheus`.',
                      'Thử các từ khóa theo workflow như `CI/CD`, `incident`, `release` hoặc `monitoring`.',
                      'Nếu kết quả quá rộng, hãy rút gọn truy vấn còn 1-2 từ khóa quan trọng nhất.',
                  ],
              };

    useEffect(() => {
        setSearchInput(query);
    }, [query]);

    useEffect(() => {
        let isMounted = true;

        const fetchSuggestedTopics = async () => {
            try {
                const response = await apiClient.get<{ data?: Category[] } | Category[]>('/api/v1/categories');
                const categories = Array.isArray(response)
                    ? response
                    : Array.isArray(response?.data)
                      ? response.data
                      : [];

                if (!isMounted) {
                    return;
                }

                setSuggestedTopics(categories.slice(0, 8).map((category) => category.name));
            } catch {
                if (!isMounted) {
                    return;
                }

                setSuggestedTopics([]);
            }
        };

        void fetchSuggestedTopics();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchResults = async () => {
            if (!query) {
                setPosts([]);
                setTotalResults(0);
                setTotalPages(1);
                setErrorMessage('');
                return;
            }

            try {
                setLoading(true);
                setErrorMessage('');

                const response = await apiClient.get<SearchPayload>(
                    `/api/v1/posts/search?search=${encodeURIComponent(query)}&page=${page}&limit=${SEARCH_POSTS_PER_PAGE}&sortBy=publishedAt&sortOrder=desc&locale=${locale}`
                );

                if (!isMounted) {
                    return;
                }

                const resolved = resolvePostsPayload(response);
                setPosts(resolved.data || []);
                setTotalResults(resolved.meta?.total || 0);
                setTotalPages(resolved.meta?.totalPages || 1);
            } catch {
                if (!isMounted) {
                    return;
                }

                setPosts([]);
                setTotalResults(0);
                setTotalPages(1);
                setErrorMessage(copy.loadingError);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void fetchResults();

        return () => {
            isMounted = false;
        };
    }, [copy.loadingError, locale, page, query]);

    useEffect(() => {
        if (!query || loading || errorMessage) {
            return;
        }

        trackSearch(query, totalResults);
    }, [errorMessage, loading, query, totalResults]);

    const summaryText = useMemo(() => {
        if (!query) {
            return copy.intro;
        }

        if (loading) {
            return copy.loading(query);
        }

        if (errorMessage) {
            return errorMessage;
        }

        return copy.results(totalResults, query);
    }, [copy, errorMessage, loading, query, totalResults]);
    const pageNumbers = useMemo(
        () =>
            Array.from({ length: totalPages }, (_, index) => index + 1).filter(
                (pageNumber) =>
                    Math.abs(pageNumber - page) <= 2 || pageNumber === 1 || pageNumber === totalPages
            ),
        [page, totalPages]
    );

    const handleSearchSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = searchInput.trim();

        if (!trimmed) {
            router.push(withLocale('/search', locale));
            return;
        }

        router.push(`${withLocale('/search', locale)}?q=${encodeURIComponent(trimmed)}`);
    };

    const handlePageChange = (nextPage: number) => {
        if (!query) {
            return;
        }

        router.push(`${withLocale('/search', locale)}?q=${encodeURIComponent(query)}&page=${nextPage}`);
    };

    const handleSuggestedTopic = (topic: string) => {
        setSearchInput(topic);
        router.push(`${withLocale('/search', locale)}?q=${encodeURIComponent(topic)}`);
    };

    return (
        <div className="flex w-full max-w-[1280px] flex-col gap-8">
            <section className="theme-surface rounded-[28px] px-6 py-8 md:px-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                            {copy.label}
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--text-main-theme)]">
                            {copy.title}
                        </h1>
                        <p className="theme-muted mt-2 text-sm">
                            {summaryText}
                        </p>
                    </div>

                    <form onSubmit={handleSearchSubmit} className="flex w-full max-w-xl gap-3">
                        <input
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder={copy.placeholder}
                            className="theme-input h-12 flex-1 rounded-xl px-4 text-sm outline-none"
                        />
                        <button
                            type="submit"
                            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-blue-600"
                        >
                            {copy.label}
                        </button>
                    </form>
                </div>
            </section>

            {!query ? (
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <section className="theme-surface rounded-2xl border border-dashed px-6 py-12">
                        <h2 className="text-xl font-bold text-[color:var(--text-main-theme)]">
                            {copy.startTitle}
                        </h2>
                        <p className="theme-muted mt-2 text-sm">
                            {copy.startBody}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            {(suggestedTopics.length ? suggestedTopics : fallbackTopics).map((topic) => (
                                <button
                                    key={topic}
                                    type="button"
                                    onClick={() => handleSuggestedTopic(topic)}
                                    className="theme-panel-muted theme-border rounded-full border px-4 py-2 text-sm font-medium text-[color:var(--text-main-theme)] transition-colors hover:border-primary hover:text-primary"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="theme-surface rounded-2xl p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            {copy.tipsTitle}
                        </p>
                        <ul className="theme-muted mt-4 space-y-3 text-sm leading-7">
                            {copy.tips.map((tip) => (
                                <li key={tip}>{tip}</li>
                            ))}
                        </ul>
                    </section>
                </div>
            ) : loading ? (
                <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 6 }, (_, index) => (
                        <div
                            key={index}
                            className="theme-surface h-[360px] animate-pulse rounded-xl"
                        />
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className="theme-surface rounded-2xl border border-dashed px-6 py-12 text-center">
                    <h2 className="text-lg font-semibold text-[color:var(--text-main-theme)]">
                        {copy.emptyTitle}
                    </h2>
                    <p className="theme-muted mt-2 text-sm">
                        {copy.emptyBody}
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                        {(suggestedTopics.length ? suggestedTopics : fallbackTopics).slice(0, 5).map((topic) => (
                            <button
                                key={`empty-${topic}`}
                                type="button"
                                onClick={() => handleSuggestedTopic(topic)}
                                className="theme-panel-muted theme-border rounded-full border px-4 py-2 text-sm font-medium text-[color:var(--text-main-theme)] transition-colors hover:border-primary hover:text-primary"
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-4">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>

                    {totalPages > 1 ? (
                        <div className="theme-surface flex flex-col gap-4 rounded-2xl px-5 py-4 md:flex-row md:items-center md:justify-between">
                            <p className="theme-muted text-sm">
                                Trang {page}/{totalPages}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="theme-panel-muted theme-border rounded-lg border px-3 py-2 text-sm text-[color:var(--text-main-theme)] transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                {pageNumbers.map((pageNumber, index) => {
                                    const previous = pageNumbers[index - 1];
                                    const showGap = previous && pageNumber - previous > 1;

                                    return (
                                        <span key={pageNumber} className="contents">
                                            {showGap ? (
                                                <span className="theme-muted inline-flex items-center px-1 text-sm">
                                                    ...
                                                </span>
                                            ) : null}
                                            <button
                                                onClick={() => handlePageChange(pageNumber)}
                                                className={`theme-border inline-flex min-w-10 items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors ${
                                                    pageNumber === page
                                                        ? 'border-primary bg-primary text-white'
                                                        : 'theme-panel-muted text-[color:var(--text-main-theme)] hover:border-primary hover:text-primary'
                                                }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        </span>
                                    );
                                })}
                                <button
                                    onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    className="theme-panel-muted theme-border rounded-lg border px-3 py-2 text-sm text-[color:var(--text-main-theme)] transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    ) : null}
                </>
            )}
        </div>
    );
}

export function SearchPageClient() {
    return (
        <Suspense
            fallback={
                <div className="flex w-full max-w-[1280px] flex-col gap-8">
                    <section className="theme-surface rounded-[28px] px-6 py-8 md:px-8">
                        <div className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
                    </section>
                </div>
            }
        >
            <SearchPageContent />
        </Suspense>
    );
}
