'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Rocket } from 'lucide-react';
import { SectionHeading } from '@/components/shared/section-heading';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { apiClient } from '@/lib/api';
import type { Tag } from '@/types';

interface ToolBubble {
    name: string;
    href: string;
    count: number;
}

const bubblePositions = [
    { top: '8%', left: '10%' },
    { top: '10%', left: '48%' },
    { top: '28%', left: '68%' },
    { top: '38%', left: '18%' },
    { top: '52%', left: '46%' },
    { top: '68%', left: '15%' },
    { top: '72%', left: '58%' },
    { top: '22%', left: '28%' },
    { top: '46%', left: '74%' },
    { top: '82%', left: '38%' },
];

const MIN_FONT_SIZE = 0.95;
const MAX_FONT_SIZE = 1.65;
const MIN_BUBBLE_WIDTH = 108;
const MAX_BUBBLE_WIDTH = 186;

function scaleValue(value: number, minValue: number, maxValue: number, minScale: number, maxScale: number) {
    if (minValue === maxValue) {
        return (minScale + maxScale) / 2;
    }

    const ratio = (value - minValue) / (maxValue - minValue);
    return minScale + ratio * (maxScale - minScale);
}

export function TrendingToolsPanel() {
    const { settings } = useSiteSettings();
    const [tagCloud, setTagCloud] = useState<ToolBubble[]>([]);

    useEffect(() => {
        let isMounted = true;

        const fallbackCloud: ToolBubble[] = settings.content.trendingTools.map((tool, index) => ({
            name: tool.name,
            href: tool.href,
            count: settings.content.trendingTools.length - index,
        }));

        const fetchTrendingTags = async () => {
            try {
                const response = await apiClient.get<{ data?: Tag[] } | Tag[]>('/api/v1/tags');
                const tags = Array.isArray(response)
                    ? response
                    : Array.isArray(response?.data)
                        ? response.data
                        : [];

                if (!isMounted) {
                    return;
                }

                const derivedCloud = tags
                    .map((tag) => ({
                        name: tag.name,
                        href: `/tag/${tag.slug}`,
                        count: tag._count?.posts ?? 0,
                    }))
                    .filter((tag) => tag.count > 0)
                    .sort((left, right) => right.count - left.count)
                    .slice(0, bubblePositions.length);

                setTagCloud(derivedCloud.length > 0 ? derivedCloud : fallbackCloud);
            } catch {
                if (!isMounted) {
                    return;
                }

                setTagCloud(fallbackCloud);
            }
        };

        void fetchTrendingTags();

        return () => {
            isMounted = false;
        };
    }, [settings.content.trendingTools]);

    const bubbles = useMemo(() => {
        if (tagCloud.length === 0) {
            return [];
        }

        const counts = tagCloud.map((tool) => tool.count);
        const minCount = Math.min(...counts);
        const maxCount = Math.max(...counts);

        return tagCloud.map((tool, index) => {
            const fontSize = scaleValue(
                tool.count,
                minCount,
                maxCount,
                MIN_FONT_SIZE,
                MAX_FONT_SIZE
            );
            const bubbleWidth = scaleValue(
                tool.count,
                minCount,
                maxCount,
                MIN_BUBBLE_WIDTH,
                MAX_BUBBLE_WIDTH
            );
            const bubbleHeight = Math.round(bubbleWidth * 0.62);
            const position = bubblePositions[index % bubblePositions.length];

            return {
                ...tool,
                fontSize,
                bubbleWidth,
                bubbleHeight,
                position,
                animationDuration: `${9 + (index % 4) * 1.8}s`,
                animationDelay: `${index * 0.35}s`,
            };
        });
    }, [tagCloud]);

    return (
        <aside className="hidden w-[18rem] shrink-0 flex-col gap-8 xl:flex">
            <div className="sticky top-24 space-y-6">
                <div className="rounded-2xl border border-gray-100 bg-surface-light p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                    <SectionHeading
                        title="Trending Tools"
                        description="Tag cloud duoc tinh theo so bai viet da gan moi chu de, bubble lon hon tuong ung muc do xuat hien cao hon."
                    />
                    <div className="mt-6 rounded-[28px] border border-white/50 bg-gradient-to-br from-cyan-500/10 via-white to-sky-100/80 p-3 shadow-inner dark:border-slate-800/80 dark:from-cyan-500/10 dark:via-slate-950 dark:to-slate-900">
                        <div className="relative h-[22rem] overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.16),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(241,248,255,0.98))] dark:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.16),transparent_30%),linear-gradient(180deg,rgba(8,15,29,0.96),rgba(12,20,39,0.98))]">
                            {bubbles.map((tool, index) => (
                                <Link
                                    key={tool.name}
                                    href={tool.href}
                                    className="floating-tool-bubble group absolute flex flex-col justify-center rounded-full border border-white/60 bg-white/80 px-4 text-center shadow-[0_12px_24px_rgba(15,23,42,0.08)] backdrop-blur-md transition-transform hover:z-10 hover:scale-[1.05] dark:border-slate-700/80 dark:bg-slate-900/78"
                                    style={{
                                        top: tool.position.top,
                                        left: tool.position.left,
                                        width: `${tool.bubbleWidth}px`,
                                        minHeight: `${tool.bubbleHeight}px`,
                                        animationDuration: tool.animationDuration,
                                        animationDelay: tool.animationDelay,
                                    }}
                                >
                                    <span
                                        className="font-black tracking-tight text-text-main transition-colors group-hover:text-primary dark:text-white"
                                        style={{ fontSize: `${tool.fontSize}rem` }}
                                    >
                                        {tool.name}
                                    </span>
                                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-sub dark:text-gray-400">
                                        {tool.count} posts
                                    </span>
                                </Link>
                            ))}
                        </div>
                        <p className="mt-3 px-1 text-xs leading-5 text-text-sub dark:text-gray-400">
                            Bubble size duoc gioi han trong khoang on dinh de cloud de doc va van giu duoc mat do thu giac.
                        </p>
                    </div>
                </div>
                <div className="rounded-2xl border border-cyan-500/10 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent p-6">
                    <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-500">
                        <Rocket className="size-6" />
                    </div>
                    <h3 className="text-lg font-bold text-text-main dark:text-white">
                        Deploy Faster
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-text-sub dark:text-gray-400">
                        Ban benchmark cloud va theo doi hieu nang he thong tren mot dashboard gon.
                    </p>
                    <Link
                        href="/search?q=monitoring"
                        className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-text-main transition-colors hover:border-cyan-500 hover:text-cyan-500 dark:border-gray-700 dark:text-white"
                    >
                        <BarChart3 className="size-4" />
                        Explore monitoring guides
                    </Link>
                </div>
            </div>
        </aside>
    );
}
