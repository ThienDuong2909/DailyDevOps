import type { Metadata } from 'next';
import Link from 'next/link';
import { PostCard } from '@/components/blog/post-card';
import type { PaginatedResponse, Post } from '@/types';

const apiBaseUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001';

type PostsPayload =
    | PaginatedResponse<Post>
    | { data?: PaginatedResponse<Post> | Post[] }
    | Post[];

function resolvePaginatedPosts(payload: PostsPayload) {
    if (Array.isArray(payload)) {
        return {
            data: payload,
            meta: {
                total: payload.length,
                page: 1,
                limit: payload.length || 12,
                totalPages: 1,
            },
        };
    }

    if (payload && typeof payload === 'object' && 'data' in payload) {
        const nested = payload.data;

        if (Array.isArray(nested)) {
            return {
                data: nested,
                meta: {
                    total: nested.length,
                    page: 1,
                    limit: nested.length || 12,
                    totalPages: 1,
                },
            };
        }

        if (nested && typeof nested === 'object' && 'meta' in nested) {
            return nested as PaginatedResponse<Post>;
        }
    }

    return payload as PaginatedResponse<Post>;
}

async function fetchPublishedPosts(page: number) {
    try {
        const response = await fetch(
            `${apiBaseUrl}/api/v1/posts/published?limit=12&page=${page}&sortBy=publishedAt&sortOrder=desc`,
            { next: { revalidate: 300 } }
        );

        if (!response.ok) {
            return {
                data: [],
                meta: {
                    total: 0,
                    page,
                    limit: 12,
                    totalPages: 1,
                },
            };
        }

        const json = await response.json();
        return resolvePaginatedPosts(json);
    } catch {
        return {
            data: [],
            meta: {
                total: 0,
                page,
                limit: 12,
                totalPages: 1,
            },
        };
    }
}

export const metadata: Metadata = {
    title: 'Articles',
    description:
        'Browse the latest DevOps Daily articles on Kubernetes, CI/CD, observability, automation, and production engineering.',
    alternates: {
        canonical: '/blog',
    },
};

export default async function BlogPage({
    searchParams,
}: {
    searchParams?: { page?: string };
}) {
    const page = Math.max(1, Number(searchParams?.page || '1'));
    const result = await fetchPublishedPosts(page);
    const posts = result.data || [];
    const totalPages = result.meta?.totalPages || 1;

    return (
        <div className="flex w-full max-w-[1280px] flex-col gap-8">
            <section className="rounded-[32px] bg-slate-950 px-6 py-10 text-white shadow-xl md:px-10 md:py-14">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    Article Library
                </p>
                <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight md:text-5xl">
                    Practical DevOps notes, tutorials, and production lessons
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                    Explore the latest published articles on Kubernetes, CI/CD,
                    observability, reliability, and cloud operations.
                </p>
            </section>

            {posts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 px-6 py-12 text-center dark:border-gray-700 dark:bg-surface-dark/60">
                    <h2 className="text-lg font-semibold text-text-main dark:text-white">
                        No published articles yet
                    </h2>
                    <p className="mt-2 text-sm text-text-sub dark:text-gray-400">
                        New articles will appear here as soon as they are published.
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
                                Page {page}/{totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Link
                                    href={page > 1 ? `/blog?page=${page - 1}` : '/blog'}
                                    aria-disabled={page === 1}
                                    className={`theme-panel-muted theme-border rounded-lg border px-3 py-2 text-sm transition-colors ${
                                        page === 1
                                            ? 'pointer-events-none opacity-50'
                                            : 'text-[color:var(--text-main-theme)] hover:border-primary hover:text-primary'
                                    }`}
                                >
                                    Previous
                                </Link>
                                <Link
                                    href={`/blog?page=${Math.min(totalPages, page + 1)}`}
                                    aria-disabled={page === totalPages}
                                    className={`theme-panel-muted theme-border rounded-lg border px-3 py-2 text-sm transition-colors ${
                                        page === totalPages
                                            ? 'pointer-events-none opacity-50'
                                            : 'text-[color:var(--text-main-theme)] hover:border-primary hover:text-primary'
                                    }`}
                                >
                                    Next
                                </Link>
                            </div>
                        </div>
                    ) : null}
                </>
            )}
        </div>
    );
}
