'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, Search, SlidersHorizontal, X } from 'lucide-react';
import { PostCard } from '@/components/blog/post-card';
import { NewsletterSignupForm } from '@/components/blog/newsletter-signup-form';
import { Skeleton } from '@/components/shared/skeleton';
import { authStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Category, Post, Tag } from '@/types';

/* ── constants ── */
const POSTS_PER_PAGE = 12;
const POPULAR_LIMIT = 5;
const MAX_TAGS = 14;

type SortOption = 'latest' | 'popular' | 'oldest';

interface SortConfig {
    label: string;
    sortBy: string;
    sortOrder: string;
}

const SORT_OPTIONS: Record<SortOption, SortConfig> = {
    latest: { label: 'Mới nhất', sortBy: 'publishedAt', sortOrder: 'desc' },
    popular: { label: 'Đọc nhiều', sortBy: 'viewCount', sortOrder: 'desc' },
    oldest: { label: 'Cũ nhất', sortBy: 'publishedAt', sortOrder: 'asc' },
};

/* ── helpers ── */
function extractPosts(payload: unknown): { posts: Post[]; total: number; totalPages: number } {
    if (Array.isArray(payload)) {
        return { posts: payload, total: payload.length, totalPages: 1 };
    }

    if (payload && typeof payload === 'object') {
        if ('data' in payload) {
            const nested = (payload as { data?: unknown; meta?: { total?: number; totalPages?: number } }).data;
            const meta = (payload as { meta?: { total?: number; totalPages?: number } }).meta;

            if (Array.isArray(nested)) {
                return {
                    posts: nested,
                    total: meta?.total ?? nested.length,
                    totalPages: meta?.totalPages ?? 1,
                };
            }

            if (nested && typeof nested === 'object' && 'data' in nested) {
                const inner = nested as { data?: Post[]; meta?: { total?: number; totalPages?: number } };
                return {
                    posts: Array.isArray(inner.data) ? inner.data : [],
                    total: inner.meta?.total ?? 0,
                    totalPages: inner.meta?.totalPages ?? 1,
                };
            }
        }

        if ('meta' in payload && 'data' in payload) {
            const p = payload as { data: Post[]; meta: { total: number; totalPages: number } };
            return { posts: p.data, total: p.meta.total, totalPages: p.meta.totalPages };
        }
    }

    return { posts: [], total: 0, totalPages: 1 };
}

function formatViews(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
}

/* ── component ── */
export function BlogListingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isAuthenticated = authStore((s) => s.isAuthenticated);

    /* ── state ── */
    const [posts, setPosts] = useState<Post[]>([]);
    const [totalPosts, setTotalPosts] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [popularPosts, setPopularPosts] = useState<Post[]>([]);
    const [isLoadingPopular, setIsLoadingPopular] = useState(true);
    const [tagCloud, setTagCloud] = useState<Tag[]>([]);
    const [isLoadingTags, setIsLoadingTags] = useState(true);

    /* ── derived from URL ── */
    const currentPage = Math.max(1, Number(searchParams.get('page') || '1'));
    const currentCategory = searchParams.get('category') || 'all';
    const currentSort = (searchParams.get('sort') as SortOption) || 'latest';
    const currentSearch = searchParams.get('q') || '';

    const [searchInput, setSearchInput] = useState(currentSearch);

    /* ── URL update helper ── */
    const updateUrl = useCallback(
        (params: Record<string, string>) => {
            const url = new URLSearchParams(searchParams.toString());
            Object.entries(params).forEach(([key, value]) => {
                if (!value || value === 'all' || value === 'latest' || (key === 'page' && value === '1')) {
                    url.delete(key);
                } else {
                    url.set(key, value);
                }
            });
            const qs = url.toString();
            router.push(qs ? `/blog?${qs}` : '/blog', { scroll: false });
        },
        [router, searchParams],
    );

    useEffect(() => {
        setSearchInput(currentSearch);
    }, [currentSearch]);

    /* ── fetch posts ── */
    useEffect(() => {
        let alive = true;

        const fetchPosts = async () => {
            setIsLoading(true);

            try {
                const sortConfig = SORT_OPTIONS[currentSort] || SORT_OPTIONS.latest;
                let url = `/api/v1/posts/published?limit=${POSTS_PER_PAGE}&page=${currentPage}&sortBy=${sortConfig.sortBy}&sortOrder=${sortConfig.sortOrder}`;

                if (currentCategory && currentCategory !== 'all') {
                    url += `&categorySlug=${encodeURIComponent(currentCategory)}`;
                }

                if (currentSearch) {
                    url += `&search=${encodeURIComponent(currentSearch)}`;
                }

                const res = await apiClient.get<unknown>(url);
                const { posts: fetchedPosts, total, totalPages: pages } = extractPosts(res);

                if (!alive) return;

                setPosts(fetchedPosts);
                setTotalPosts(total);
                setTotalPages(pages);
            } catch {
                if (alive) {
                    setPosts([]);
                    setTotalPosts(0);
                    setTotalPages(1);
                }
            } finally {
                if (alive) setIsLoading(false);
            }
        };

        fetchPosts();
        return () => { alive = false; };
    }, [currentPage, currentCategory, currentSort, currentSearch]);

    /* ── fetch categories ── */
    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const res = await apiClient.get<{ data?: Category[] } | Category[]>('/api/v1/categories');
                const cats = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
                if (alive) setCategories(cats);
            } catch {
                /* silent */
            } finally {
                if (alive) setIsLoadingCategories(false);
            }
        })();

        return () => { alive = false; };
    }, []);

    /* ── fetch popular posts ── */
    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const res = await apiClient.get<{ data?: Post[] } | Post[]>(
                    `/api/v1/posts/published?limit=${POPULAR_LIMIT}&sortBy=viewCount&sortOrder=desc`,
                );
                const result = Array.isArray(res)
                    ? res
                    : Array.isArray((res as { data?: Post[] })?.data)
                        ? (res as { data: Post[] }).data
                        : [];
                if (alive) setPopularPosts(result.filter((p) => (p.viewCount ?? 0) > 0));
            } catch {
                /* silent */
            } finally {
                if (alive) setIsLoadingPopular(false);
            }
        })();

        return () => { alive = false; };
    }, []);

    /* ── fetch tags ── */
    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const res = await apiClient.get<{ data?: Tag[] } | Tag[]>('/api/v1/tags');
                const tags = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
                if (alive) {
                    setTagCloud(
                        tags
                            .filter((t) => (t._count?.posts ?? 0) > 0)
                            .sort((a, b) => (b._count?.posts ?? 0) - (a._count?.posts ?? 0))
                            .slice(0, MAX_TAGS),
                    );
                }
            } catch {
                /* silent */
            } finally {
                if (alive) setIsLoadingTags(false);
            }
        })();

        return () => { alive = false; };
    }, []);

    /* ── search handler ── */
    useEffect(() => {
        const normalizedInput = searchInput.trim();
        const normalizedCurrentSearch = currentSearch.trim();

        const timeout = setTimeout(() => {
            if (normalizedInput === normalizedCurrentSearch) {
                return;
            }

            updateUrl({ q: normalizedInput, page: '1' });
        }, 400);

        return () => clearTimeout(timeout);
    }, [currentSearch, searchInput, updateUrl]);

    const clearSearch = useCallback(() => {
        setSearchInput('');
        updateUrl({ q: '', page: '1' });
    }, [updateUrl]);

    /* ── pagination ── */
    const pageNumbers = useMemo(() => {
        return Array.from({ length: totalPages }, (_, i) => i + 1).filter(
            (p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages,
        );
    }, [totalPages, currentPage]);

    return (
        <div className="flex w-full max-w-[1280px] flex-col gap-8">
            {/* ── Page Header ── */}
            <header className="space-y-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-[var(--text-main-theme)] md:text-4xl">
                        Tất cả bài viết
                    </h1>
                    <p className="text-sm text-[var(--text-muted-theme)] md:text-base">
                        Khám phá {totalPosts > 0 ? `${totalPosts} ` : ''}bài viết về Kubernetes, CI/CD, Observability và Cloud Operations.
                    </p>
                </div>

                {/* ── Search + Sort Bar ── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative max-w-md flex-1">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[var(--text-soft-theme)]" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm bài viết..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="theme-input h-11 w-full rounded-xl pl-10 pr-10 text-sm transition-all"
                        />
                        {searchInput && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--text-soft-theme)] transition-colors hover:bg-[var(--surface-strong)] hover:text-[var(--text-main-theme)]"
                                type="button"
                                aria-label="Clear search"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="size-4 text-[var(--text-soft-theme)]" />
                        <div className="flex gap-1 rounded-xl bg-[var(--surface-muted)] p-1">
                            {(Object.entries(SORT_OPTIONS) as [SortOption, SortConfig][]).map(([key, config]) => (
                                <button
                                    key={key}
                                    onClick={() => updateUrl({ sort: key, page: '1' })}
                                    className={cn(
                                        'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                                        currentSort === key
                                            ? 'bg-[var(--surface-elevated)] text-[var(--text-main-theme)] shadow-sm'
                                            : 'text-[var(--text-muted-theme)] hover:text-[var(--text-main-theme)]',
                                    )}
                                    type="button"
                                >
                                    {config.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Category Pills ── */}
            <nav className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Category filter">
                {isLoadingCategories ? (
                    <>
                        {Array.from({ length: 6 }, (_, i) => (
                            <Skeleton
                                key={i}
                                className="h-9 shrink-0 rounded-full"
                                style={{ width: 64 + (i % 3) * 22 }}
                            />
                        ))}
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => updateUrl({ category: 'all', page: '1' })}
                            className={cn(
                                'flex h-9 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-medium transition-all active:scale-95',
                                currentCategory === 'all'
                                    ? 'border-primary bg-primary text-white shadow-sm'
                                    : 'border-[var(--border-soft-theme)] bg-[var(--surface-elevated)] text-[var(--text-main-theme)] hover:border-primary hover:text-primary',
                            )}
                            type="button"
                        >
                            Tất cả
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => updateUrl({ category: cat.slug, page: '1' })}
                                className={cn(
                                    'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-all active:scale-95',
                                    currentCategory === cat.slug
                                        ? 'border-primary bg-primary text-white shadow-sm'
                                        : 'border-[var(--border-soft-theme)] bg-[var(--surface-elevated)] text-[var(--text-main-theme)] hover:border-primary hover:text-primary',
                                )}
                                type="button"
                            >
                                {cat.name}
                                {cat._count?.posts ? (
                                    <span
                                        className={cn(
                                            'ml-0.5 text-[11px]',
                                            currentCategory === cat.slug
                                                ? 'text-white/70'
                                                : 'text-[var(--text-soft-theme)]',
                                        )}
                                    >
                                        {cat._count.posts}
                                    </span>
                                ) : null}
                            </button>
                        ))}
                    </>
                )}
            </nav>

            {/* ── Main Content + Sidebar ── */}
            <div className="flex flex-col gap-8 lg:flex-row">
                {/* ── Post Grid ── */}
                <div className="min-w-0 flex-1">
                    {isLoading ? (
                        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: POSTS_PER_PAGE > 9 ? 9 : POSTS_PER_PAGE }, (_, i) => (
                                <div
                                    key={i}
                                    className="overflow-hidden rounded-2xl bg-[var(--surface-elevated)] shadow-[0_2px_12px_rgba(15,23,42,0.06)]"
                                >
                                    <Skeleton className="aspect-[16/9] w-full rounded-none" />
                                    <div className="space-y-3 px-5 pb-5 pt-4">
                                        <Skeleton className="h-5 w-full" />
                                        <Skeleton className="h-5 w-3/4" />
                                        <div className="flex items-center gap-2 pt-1">
                                            <Skeleton className="size-7 rounded-full" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[var(--border-soft-theme)] bg-[var(--surface-elevated)] px-6 py-16 text-center">
                            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-[var(--surface-muted)]">
                                <Search className="size-7 text-[var(--text-soft-theme)]" />
                            </div>
                            <h2 className="text-lg font-bold text-[var(--text-main-theme)]">
                                {currentSearch
                                    ? 'Không tìm thấy bài viết nào'
                                    : 'Chưa có bài viết nào'}
                            </h2>
                            <p className="mt-2 text-sm text-[var(--text-muted-theme)]">
                                {currentSearch
                                    ? `Không có kết quả cho "${currentSearch}". Hãy thử từ khóa khác hoặc xóa bộ lọc.`
                                    : 'Các bài viết mới sẽ xuất hiện tại đây khi được xuất bản.'}
                            </p>
                            {(currentSearch || currentCategory !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchInput('');
                                        router.push('/blog');
                                    }}
                                    className="mt-4 inline-flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                                    type="button"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
                            {posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    )}

                    {/* ── Pagination ── */}
                    {!isLoading && totalPages > 1 && (
                        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-[var(--border-soft-theme)] bg-[var(--surface-elevated)] px-5 py-4 md:flex-row md:items-center md:justify-between">
                            <p className="text-sm text-[var(--text-muted-theme)]">
                                Trang {currentPage}/{totalPages}
                                <span className="ml-2 text-[var(--text-soft-theme)]">
                                    · {totalPosts} bài viết
                                </span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href={currentPage > 1 ? `/blog?page=${currentPage - 1}` : '/blog'}
                                    aria-disabled={currentPage === 1}
                                    className={cn(
                                        'inline-flex min-w-10 items-center justify-center rounded-lg border border-[var(--border-soft-theme)] bg-[var(--surface-muted)] px-3 py-2 text-sm transition-colors',
                                        currentPage === 1
                                            ? 'pointer-events-none opacity-50'
                                            : 'text-[var(--text-main-theme)] hover:border-primary hover:text-primary',
                                    )}
                                >
                                    ←
                                </Link>
                                {pageNumbers.map((pn, idx) => {
                                    const prev = pageNumbers[idx - 1];
                                    const showGap = prev && pn - prev > 1;

                                    return (
                                        <span key={pn} className="contents">
                                            {showGap && (
                                                <span className="inline-flex items-center px-1 text-sm text-[var(--text-soft-theme)]">
                                                    ···
                                                </span>
                                            )}
                                            <Link
                                                href={pn === 1 ? '/blog' : `/blog?page=${pn}`}
                                                className={cn(
                                                    'inline-flex min-w-10 items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors',
                                                    pn === currentPage
                                                        ? 'border-primary bg-primary text-white'
                                                        : 'border-[var(--border-soft-theme)] bg-[var(--surface-muted)] text-[var(--text-main-theme)] hover:border-primary hover:text-primary',
                                                )}
                                            >
                                                {pn}
                                            </Link>
                                        </span>
                                    );
                                })}
                                <Link
                                    href={`/blog?page=${Math.min(totalPages, currentPage + 1)}`}
                                    aria-disabled={currentPage === totalPages}
                                    className={cn(
                                        'inline-flex min-w-10 items-center justify-center rounded-lg border border-[var(--border-soft-theme)] bg-[var(--surface-muted)] px-3 py-2 text-sm transition-colors',
                                        currentPage === totalPages
                                            ? 'pointer-events-none opacity-50'
                                            : 'text-[var(--text-main-theme)] hover:border-primary hover:text-primary',
                                    )}
                                >
                                    →
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Sidebar ── */}
                <aside className="hidden w-[18rem] shrink-0 lg:block">
                    <div className="sticky top-24 space-y-6">
                        {/* ── Popular Posts ── */}
                        {isLoadingPopular ? (
                            <div className="overflow-hidden rounded-2xl border border-[var(--border-soft-theme)] bg-[var(--surface-elevated)]">
                                <div className="px-5 pb-1 pt-5">
                                    <Skeleton className="h-5 w-32" />
                                </div>
                                <div className="space-y-0 divide-y divide-[var(--border-ghost-theme)] px-5 pb-4 pt-2">
                                    {Array.from({ length: POPULAR_LIMIT }, (_, i) => (
                                        <div key={i} className="flex items-start gap-3 py-3">
                                            <Skeleton className="mt-0.5 size-6 shrink-0 rounded-md" />
                                            <div className="min-w-0 flex-1 space-y-2">
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : popularPosts.length > 0 ? (
                            <div className="overflow-hidden rounded-2xl border border-[var(--border-soft-theme)] bg-[var(--surface-elevated)]">
                                <div className="px-5 pb-1 pt-5">
                                    <h3 className="text-base font-extrabold tracking-tight text-[var(--text-main-theme)]">
                                        Đọc nhiều nhất
                                    </h3>
                                </div>
                                <ol className="divide-y divide-[var(--border-ghost-theme)] px-5 pb-4 pt-2">
                                    {popularPosts.map((post, idx) => (
                                        <li key={post.id}>
                                            <Link
                                                href={`/blog/${post.slug}`}
                                                className="group flex items-start gap-3 py-3 transition-colors"
                                            >
                                                <span
                                                    className={cn(
                                                        'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-extrabold',
                                                        idx === 0
                                                            ? 'bg-orange-500/15 text-orange-500'
                                                            : idx === 1
                                                                ? 'bg-amber-500/15 text-amber-500'
                                                                : idx === 2
                                                                    ? 'bg-yellow-600/15 text-yellow-600'
                                                                    : 'bg-[var(--surface-muted)] text-[var(--text-soft-theme)]',
                                                    )}
                                                >
                                                    {idx + 1}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-[var(--text-main-theme)] transition-colors group-hover:text-primary">
                                                        {post.title}
                                                    </p>
                                                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--text-soft-theme)]">
                                                        <span className="inline-flex items-center gap-1">
                                                            <Eye className="size-3" />
                                                            {formatViews(post.viewCount)}
                                                        </span>
                                                        <span className="size-[3px] rounded-full bg-current opacity-40" />
                                                        <span>
                                                            {new Date(
                                                                post.updatedAt || post.publishedAt || post.createdAt,
                                                            ).toLocaleDateString('vi-VN', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        ) : null}

                        {/* ── Tag Cloud ── */}
                        {isLoadingTags ? (
                            <div className="overflow-hidden rounded-2xl border border-[var(--border-soft-theme)] bg-[var(--surface-elevated)]">
                                <div className="px-5 pb-2 pt-5">
                                    <Skeleton className="h-5 w-28" />
                                </div>
                                <div className="flex flex-wrap gap-2 px-4 pb-5 pt-3">
                                    {Array.from({ length: 8 }, (_, i) => (
                                        <Skeleton
                                            key={i}
                                            className="rounded-full"
                                            style={{ width: 56 + (i % 3) * 20, height: 30 }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : tagCloud.length > 0 ? (
                            <div className="overflow-hidden rounded-2xl border border-[var(--border-soft-theme)] bg-[var(--surface-elevated)]">
                                <div className="px-5 pb-2 pt-5">
                                    <h3 className="text-base font-extrabold tracking-tight text-[var(--text-main-theme)]">
                                        Chủ đề
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-2 px-4 pb-5 pt-3">
                                    {tagCloud.map((tag) => (
                                        <Link
                                            key={tag.id}
                                            href={`/tag/${tag.slug}`}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-soft-theme)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--text-main-theme)] transition-all hover:border-primary/40 hover:text-primary"
                                        >
                                            <span className="text-[var(--text-soft-theme)]">#</span>
                                            {tag.name}
                                            {tag._count?.posts ? (
                                                <span className="text-[10px] text-[var(--text-soft-theme)]">
                                                    {tag._count.posts}
                                                </span>
                                            ) : null}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                    </div>
                </aside>
            </div>

            {/* ── Newsletter CTA ── */}
            {!isAuthenticated && (
                <section className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-500 shadow-lg">
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 20% 20%, white, transparent 35%), radial-gradient(circle at 80% 0%, white, transparent 30%)',
                        }}
                    />
                    <div className="relative flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-12">
                        <div className="max-w-2xl space-y-2 text-center md:text-left">
                            <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                                Đừng bỏ lỡ bài viết mới
                            </h2>
                            <p className="text-sm leading-6 text-cyan-50 md:text-base">
                                Nhận thông báo hàng tuần về CI/CD, Kubernetes, automation và production operations.
                            </p>
                        </div>
                        <div className="w-full max-w-md">
                            <NewsletterSignupForm
                                buttonClassName="bg-surface-dark hover:bg-gray-900"
                                buttonLabel="Đăng ký"
                                helperText="Cập nhật DevOps hàng tuần, không spam."
                                inputClassName="flex-1"
                            />
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
