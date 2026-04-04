import { Skeleton } from '@/components/shared/skeleton';

export function BlogPageSkeleton() {
    return (
        <div className="flex w-full max-w-[1280px] flex-col gap-8">
            <div className="theme-surface grid gap-6 rounded-3xl p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8 lg:p-10">
                <div className="space-y-5">
                    <Skeleton className="h-7 w-40 rounded-full" />
                    <div className="space-y-3">
                        <Skeleton className="h-12 w-full max-w-2xl" />
                        <Skeleton className="h-12 w-4/5" />
                        <Skeleton className="h-5 w-full max-w-xl" />
                        <Skeleton className="h-5 w-3/4" />
                    </div>
                    <div className="flex gap-4">
                        <Skeleton className="h-11 w-36" />
                        <Skeleton className="h-11 w-36" />
                    </div>
                </div>
                <Skeleton className="aspect-video w-full rounded-2xl" />
            </div>
            <div className="flex flex-wrap gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-9 w-24 rounded-full" />
                ))}
            </div>
            <div className="flex flex-col gap-8 lg:flex-row">
                <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="theme-surface overflow-hidden rounded-2xl"
                        >
                            <Skeleton className="aspect-video w-full rounded-none" />
                            <div className="space-y-4 p-5">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-4/5" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="hidden w-80 shrink-0 flex-col gap-6 lg:flex">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-56 w-full" />
                </div>
            </div>
        </div>
    );
}
