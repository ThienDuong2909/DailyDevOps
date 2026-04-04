'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { trackSearch } from '@/lib/analytics';
import { PostCard } from '@/components/blog/post-card';
import type { Category, PaginatedResponse, Post } from '@/types';

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
    const query = searchParams.get('q')?.trim() || '';
    const page = Number(searchParams.get('page') || '1');

    const [searchInput, setSearchInput] = useState(query);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [totalResults, setTotalResults] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);

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
                    `/api/v1/posts/search?search=${encodeURIComponent(query)}&page=${page}&limit=12&sortBy=publishedAt&sortOrder=desc`
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
                setErrorMessage('Khong the tai ket qua tim kiem luc nay.');
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
    }, [page, query]);

    useEffect(() => {
        if (!query || loading || errorMessage) {
            return;
        }

        trackSearch(query, totalResults);
    }, [errorMessage, loading, query, totalResults]);

    const summaryText = useMemo(() => {
        if (!query) {
            return 'Nhap tu khoa de tim bai viet, hoac bat dau tu cac chu de pho bien ben duoi.';
        }

        if (loading) {
            return `Dang tim kiem "${query}"...`;
        }

        if (errorMessage) {
            return errorMessage;
        }

        return `Tim thay ${totalResults} ket qua cho "${query}"`;
    }, [errorMessage, loading, query, totalResults]);

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = searchInput.trim();

        if (!trimmed) {
            router.push('/search');
            return;
        }

        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    };

    const handlePageChange = (nextPage: number) => {
        if (!query) {
            return;
        }

        router.push(`/search?q=${encodeURIComponent(query)}&page=${nextPage}`);
    };

    const handleSuggestedTopic = (topic: string) => {
        setSearchInput(topic);
        router.push(`/search?q=${encodeURIComponent(topic)}`);
    };

    return (
        <div className="flex w-full max-w-[1280px] flex-col gap-8">
            <section className="theme-surface rounded-[28px] px-6 py-8 md:px-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                            Search
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--text-main-theme)]">
                            Tim bai viet trong DevOps Daily
                        </h1>
                        <p className="theme-muted mt-2 text-sm">
                            {summaryText}
                        </p>
                    </div>

                    <form onSubmit={handleSearchSubmit} className="flex w-full max-w-xl gap-3">
                        <input
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Kubernetes, CI/CD, monitoring..."
                            className="theme-input h-12 flex-1 rounded-xl px-4 text-sm outline-none"
                        />
                        <button
                            type="submit"
                            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-blue-600"
                        >
                            Tim
                        </button>
                    </form>
                </div>
            </section>

            {!query ? (
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <section className="theme-surface rounded-2xl border border-dashed px-6 py-12">
                        <h2 className="text-xl font-bold text-[color:var(--text-main-theme)]">
                            Bat dau voi chu de pho bien
                        </h2>
                        <p className="theme-muted mt-2 text-sm">
                            Chon mot chu de goi y de tim nhanh nhung bai viet phu hop voi nhu cau hien tai.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            {(suggestedTopics.length ? suggestedTopics : ['CI/CD', 'Kubernetes', 'Terraform']).map((topic) => (
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
                            Search Tips
                        </p>
                        <ul className="theme-muted mt-4 space-y-3 text-sm leading-7">
                            <li>Tim theo cong nghe cu the nhu `Terraform`, `Kubernetes`, `Prometheus`.</li>
                            <li>Tim theo workflow nhu `CI/CD`, `incident`, `release`, `monitoring`.</li>
                            <li>Neu ket qua qua rong, thu rut gon query ve 1-2 tu khoa chinh.</li>
                        </ul>
                    </section>
                </div>
            ) : loading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                        Khong tim thay bai viet phu hop
                    </h2>
                    <p className="theme-muted mt-2 text-sm">
                        Thu doi tu khoa, rut gon cum tim kiem, hoac quay lai trang blog de duyet theo danh muc.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>

                    {totalPages > 1 ? (
                        <div className="theme-surface flex items-center justify-between rounded-2xl px-5 py-4">
                            <p className="theme-muted text-sm">
                                Trang {page}/{totalPages}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="theme-panel-muted theme-border rounded-lg border px-3 py-2 text-sm text-[color:var(--text-main-theme)] transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>
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
