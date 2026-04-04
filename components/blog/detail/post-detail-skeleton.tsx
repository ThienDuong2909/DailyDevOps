import { Skeleton } from '@/components/shared/skeleton';

function SidebarSkeletonCard() {
    return (
        <div className="theme-surface rounded-2xl p-5">
            <Skeleton className="mb-4 h-5 w-28" />
            <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
            </div>
        </div>
    );
}

export function PostDetailSkeleton() {
    return (
        <div className="theme-shell min-h-screen">
            <div className="mx-auto max-w-[1280px] px-4 pt-10 lg:px-8">
                <Skeleton className="mb-6 h-4 w-56" />
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
                    <div>
                        <Skeleton className="mb-4 h-10 w-full max-w-4xl" />
                        <Skeleton className="mb-8 h-10 w-4/5 max-w-3xl" />
                        <div className="theme-border mb-8 flex items-center gap-4 border-b pb-6">
                            <Skeleton className="size-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-3 w-56" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {Array.from({ length: 3 }, (_, index) => (
                                <Skeleton key={index} className="h-4 w-full" />
                            ))}
                            <Skeleton className="h-8 w-3/4" />
                            {Array.from({ length: 8 }, (_, index) => (
                                <Skeleton key={`body-${index}`} className="h-4 w-full" />
                            ))}
                            <Skeleton className="h-56 w-full rounded-xl" />
                            {Array.from({ length: 7 }, (_, index) => (
                                <Skeleton key={`tail-${index}`} className="h-4 w-full" />
                            ))}
                        </div>
                        <div className="mt-14">
                            <Skeleton className="mb-6 h-8 w-40" />
                            <div className="theme-surface rounded-2xl p-6">
                                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Skeleton className="h-12 w-full rounded-lg" />
                                    <Skeleton className="h-12 w-full rounded-lg" />
                                </div>
                                <Skeleton className="h-36 w-full rounded-lg" />
                                <Skeleton className="mt-4 h-10 w-36 rounded-lg" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-5">
                        {Array.from({ length: 5 }, (_, index) => (
                            <SidebarSkeletonCard key={index} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
