'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Skeleton } from '@/components/shared/skeleton';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { apiClient } from '@/lib/api';
import type { Post, Tag } from '@/types';

interface ToolBubble {
    name: string;
    href: string;
    count: number;
}

/* ── scaling constants ── */
const MIN_FONT = 11;
const MAX_FONT = 22;
const MAX_TAGS = 12;
const POPULAR_LIMIT = 5;

function lerp(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number,
) {
    if (inMin === inMax) return (outMin + outMax) / 2;
    return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/* ── shuffle array deterministically ── */
function deterministicShuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    let seed = 42;
    for (let i = result.length - 1; i > 0; i--) {
        seed = (seed * 16807) % 2147483647;
        const j = seed % (i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function formatViews(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
}

export function TrendingToolsPanel() {
    const { settings } = useSiteSettings();
    const [tagCloud, setTagCloud] = useState<ToolBubble[]>([]);
    const [popularPosts, setPopularPosts] = useState<Post[]>([]);
    const [isLoadingTags, setIsLoadingTags] = useState(true);
    const [isLoadingPopular, setIsLoadingPopular] = useState(true);

    /* ── fetch tags ── */
    useEffect(() => {
        let alive = true;

        const fallback: ToolBubble[] = settings.content.trendingTools.map(
            (t, i) => ({
                name: t.name,
                href: t.href,
                count: settings.content.trendingTools.length - i,
            }),
        );

        (async () => {
            try {
                const res = await apiClient.get<{ data?: Tag[] } | Tag[]>(
                    '/api/v1/tags',
                );
                const tags = Array.isArray(res)
                    ? res
                    : Array.isArray(res?.data)
                      ? res.data
                      : [];

                if (!alive) return;

                const cloud = tags
                    .map((t) => ({
                        name: t.name,
                        href: `/tag/${t.slug}`,
                        count: t._count?.posts ?? 0,
                    }))
                    .filter((t) => t.count > 0)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, MAX_TAGS);

                setTagCloud(cloud.length > 0 ? cloud : fallback);
            } catch {
                if (alive) setTagCloud(fallback);
            } finally {
                if (alive) setIsLoadingTags(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [settings.content.trendingTools]);

    /* ── fetch popular posts ── */
    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const res = await apiClient.get<{ data?: Post[] } | Post[]>(
                    `/api/v1/posts/published?limit=${POPULAR_LIMIT}&sortBy=viewCount&sortOrder=desc`,
                );
                const posts = Array.isArray(res)
                    ? res
                    : Array.isArray((res as { data?: Post[] })?.data)
                      ? (res as { data: Post[] }).data
                      : [];

                if (!alive) return;
                setPopularPosts(posts.filter((p) => (p.viewCount ?? 0) > 0));
            } catch {
                /* silent — the section just won't render */
            } finally {
                if (alive) setIsLoadingPopular(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    /* ── compute visual props ── */
    const bubbles = useMemo(() => {
        if (tagCloud.length === 0) return [];

        const counts = tagCloud.map((t) => t.count);
        const lo = Math.min(...counts);
        const hi = Math.max(...counts);

        /* Shuffle to avoid biggest-first layout */
        const shuffled = deterministicShuffle(tagCloud);

        return shuffled.map((tool, idx) => {
            const fontSize = lerp(tool.count, lo, hi, MIN_FONT, MAX_FONT);
            const dur = 6 + (idx % 5) * 1.4;
            const delay = -(idx * 0.8);

            return {
                ...tool,
                fontSize,
                dur,
                delay,
                animType: idx % 2 === 0 ? 'bubbleDriftNarrow' : 'bubbleDriftWide',
            };
        });
    }, [tagCloud]);

    return (
        <aside className="hidden w-[18rem] shrink-0 flex-col gap-6 xl:flex">
            <div className="sticky top-24 space-y-6">
                {/* ── Most Popular ── */}
                {isLoadingPopular ? (
                    <div className="overflow-hidden rounded-2xl border border-[var(--border-soft-theme)] bg-[var(--surface-elevated)]">
                        <div className="px-5 pt-5 pb-1">
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
                        <div className="px-5 pt-5 pb-1">
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
                                        {/* Ranking number */}
                                        <span
                                            className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-extrabold ${
                                                idx === 0
                                                    ? 'bg-orange-500/15 text-orange-500'
                                                    : idx === 1
                                                      ? 'bg-amber-500/15 text-amber-500'
                                                      : idx === 2
                                                        ? 'bg-yellow-600/15 text-yellow-600'
                                                        : 'bg-[var(--surface-muted)] text-[var(--text-soft-theme)]'
                                            }`}
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
                                                    {new Date(post.updatedAt || post.publishedAt || post.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    </div>
                ) : null}

                {/* ── Trending Tools ── */}
                {isLoadingTags ? (
                    <div className="overflow-hidden rounded-2xl border border-[var(--border-soft-theme)] bg-[var(--surface-elevated)]">
                        <div className="px-5 pt-5 pb-2">
                            <Skeleton className="h-5 w-32" />
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 px-4 pb-5 pt-3">
                            {Array.from({ length: 8 }, (_, i) => (
                                <Skeleton
                                    key={i}
                                    className="rounded-full"
                                    style={{
                                        width: 50 + (i % 3) * 24,
                                        height: 28 + (i % 2) * 4,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                <div className="overflow-hidden rounded-2xl border border-[var(--border-soft-theme)] bg-[var(--surface-elevated)]">
                    <div className="px-5 pt-5 pb-2">
                        <h3 className="text-base font-extrabold tracking-tight text-[var(--text-main-theme)]">
                            Trending Tools
                        </h3>
                    </div>

                    {/* Flow-based tag cloud */}
                    <div className="flex flex-wrap items-center justify-center gap-2 px-4 pb-5 pt-3">
                        {bubbles.map((b) => (
                            <Link
                                key={b.name}
                                href={b.href}
                                className="inline-block whitespace-nowrap rounded-full border border-[var(--border-soft-theme)] bg-[var(--surface-elevated)] font-bold text-[var(--text-main-theme)] shadow-sm transition-all duration-200 hover:z-20 hover:scale-110 hover:border-primary/40 hover:text-primary hover:shadow-md"
                                style={{
                                    fontSize: b.fontSize,
                                    paddingInline: Math.max(10, b.fontSize * 0.7),
                                    paddingBlock: Math.max(4, b.fontSize * 0.3),
                                    animation: `${b.animType} ${b.dur}s ease-in-out ${b.delay}s infinite`,
                                }}
                            >
                                {b.name}
                            </Link>
                        ))}
                    </div>
                </div>
                )}
            </div>
        </aside>
    );
}

