'use client';

import { Skeleton } from '@/components/shared/skeleton';

function SidebarSkeletonCard({
    titleWidth = 'w-28',
    children,
}: {
    titleWidth?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="theme-surface rounded-2xl p-5">
            <Skeleton className={`mb-4 h-5 ${titleWidth}`} />
            {children}
        </div>
    );
}

export function PostDetailSkeleton() {
    return (
        <div className="theme-shell min-h-screen animate-in fade-in duration-300">
            {/* Progress bar placeholder */}
            <div className="fixed left-0 right-0 top-0 z-50 h-1" />

            <div className="mx-auto max-w-[1280px] px-4 pt-10 lg:px-8">
                {/* Breadcrumb */}
                <div className="mb-6 flex items-center gap-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-44" />
                </div>

                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
                    {/* Main content column */}
                    <div className="min-w-0">
                        {/* Title — two lines */}
                        <Skeleton className="mb-3 h-9 w-full max-w-[90%]" />
                        <Skeleton className="mb-5 h-9 w-3/5" />

                        {/* Author row */}
                        <div className="mb-8 flex items-center gap-4 border-b pb-6" style={{ borderColor: 'var(--border-soft-theme)' }}>
                            <Skeleton className="size-12 shrink-0 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-3.5 w-56" />
                            </div>
                        </div>

                        {/* Category + tags */}
                        <div className="mb-8 flex flex-wrap items-center gap-3">
                            <Skeleton className="h-8 w-24 rounded-full" />
                            <Skeleton className="h-8 w-20 rounded-full" />
                            <Skeleton className="h-8 w-28 rounded-full" />
                            <Skeleton className="h-8 w-16 rounded-full" />
                        </div>

                        {/* Article body */}
                        <div className="space-y-4">
                            {/* First paragraph */}
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[92%]" />
                            <Skeleton className="h-4 w-[78%]" />

                            {/* Heading */}
                            <Skeleton className="mt-4 h-7 w-2/3" />

                            {/* Second paragraph */}
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[88%]" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[65%]" />

                            {/* Code block mockup */}
                            <div className="my-4 overflow-hidden rounded-xl" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border-soft-theme)' }}>
                                <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border-ghost-theme)' }}>
                                    <Skeleton className="size-3 rounded-full" />
                                    <Skeleton className="size-3 rounded-full" />
                                    <Skeleton className="size-3 rounded-full" />
                                </div>
                                <div className="space-y-3 p-5">
                                    <Skeleton className="h-3.5 w-3/4" />
                                    <Skeleton className="h-3.5 w-[60%]" />
                                    <Skeleton className="h-3.5 w-[85%]" />
                                    <Skeleton className="h-3.5 w-1/2" />
                                    <Skeleton className="h-3.5 w-[70%]" />
                                </div>
                            </div>

                            {/* Third paragraph */}
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[80%]" />

                            {/* Image placeholder */}
                            <Skeleton className="h-56 w-full rounded-xl" />

                            {/* More text */}
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[72%]" />
                        </div>

                        {/* CTA section */}
                        <div className="mt-12 rounded-[28px] p-6" style={{ background: 'var(--surface-base)', border: '1px solid var(--border-soft-theme)' }}>
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="mt-3 h-7 w-4/5" />
                            <Skeleton className="mt-3 h-4 w-full max-w-lg" />
                            <div className="mt-5 flex flex-wrap gap-3">
                                <Skeleton className="h-11 w-40 rounded-xl" />
                                <Skeleton className="h-11 w-40 rounded-xl" />
                            </div>
                        </div>

                        {/* Discussion section */}
                        <div className="mt-14">
                            <div className="mb-6 flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-7 w-32" />
                                    <Skeleton className="h-4 w-52" />
                                </div>
                                <Skeleton className="h-10 w-36 rounded-xl" />
                            </div>
                            <div className="rounded-2xl p-6" style={{ background: 'var(--surface-base)', border: '1px solid var(--border-soft-theme)' }}>
                                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Skeleton className="h-12 w-full rounded-2xl" />
                                    <Skeleton className="h-12 w-full rounded-2xl" />
                                </div>
                                <Skeleton className="h-28 w-full rounded-2xl" />
                                <Skeleton className="mt-4 h-10 w-36 rounded-2xl" />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="hidden space-y-5 lg:block">
                        {/* On this page (ToC) */}
                        <SidebarSkeletonCard titleWidth="w-28">
                            <div className="space-y-2">
                                <Skeleton className="h-9 w-full rounded-lg" />
                                <Skeleton className="ml-4 h-8 w-5/6 rounded-lg" />
                                <Skeleton className="h-9 w-full rounded-lg" />
                                <Skeleton className="ml-4 h-8 w-4/6 rounded-lg" />
                                <Skeleton className="h-9 w-[90%] rounded-lg" />
                                <Skeleton className="h-9 w-full rounded-lg" />
                            </div>
                        </SidebarSkeletonCard>

                        {/* Article snapshot */}
                        <SidebarSkeletonCard titleWidth="w-32">
                            <div className="space-y-3">
                                {['Published', 'Reading time', 'Views'].map((label) => (
                                    <div key={label} className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                ))}
                            </div>
                        </SidebarSkeletonCard>

                        {/* Share and explore */}
                        <SidebarSkeletonCard titleWidth="w-32">
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    <Skeleton className="h-7 w-16 rounded-full" />
                                    <Skeleton className="h-7 w-20 rounded-full" />
                                    <Skeleton className="h-7 w-14 rounded-full" />
                                </div>
                                <Skeleton className="h-10 w-full rounded-xl" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                        </SidebarSkeletonCard>

                        {/* Continue reading */}
                        <SidebarSkeletonCard titleWidth="w-32">
                            <div className="space-y-4">
                                {Array.from({ length: 3 }, (_, i) => (
                                    <div key={i} className="space-y-1.5 rounded-xl px-2 py-1">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                ))}
                            </div>
                        </SidebarSkeletonCard>

                        {/* Popular now */}
                        <SidebarSkeletonCard titleWidth="w-24">
                            <div className="space-y-4">
                                {Array.from({ length: 4 }, (_, i) => (
                                    <div key={i} className="space-y-1.5 rounded-xl px-2 py-1">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                ))}
                            </div>
                        </SidebarSkeletonCard>
                    </aside>
                </div>
            </div>
        </div>
    );
}
