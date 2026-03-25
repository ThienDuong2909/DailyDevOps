import { Skeleton } from '@/components/shared/skeleton';

export function AdminDashboardSkeleton() {
    return (
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className="rounded-xl border border-border-dark bg-[#1e293b] p-5"
                    >
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="mt-5 h-8 w-24" />
                        <Skeleton className="mt-3 h-4 w-20" />
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="rounded-xl border border-border-dark bg-[#1e293b] p-6 xl:col-span-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="mt-6 h-[280px] w-full" />
                </div>
                <div className="rounded-xl border border-border-dark bg-[#0f1216] p-4">
                    <Skeleton className="h-[360px] w-full" />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="rounded-xl border border-border-dark bg-[#1e293b] p-6 xl:col-span-2">
                    <Skeleton className="h-[320px] w-full" />
                </div>
                <div className="rounded-xl border border-border-dark bg-[#1e293b] p-6">
                    <Skeleton className="h-[320px] w-full" />
                </div>
            </div>
        </div>
    );
}
