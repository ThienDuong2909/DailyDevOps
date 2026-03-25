import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PostCard } from '@/components/blog/post-card';
import { SectionHeading } from '@/components/shared/section-heading';
import { Skeleton } from '@/components/shared/skeleton';
import type { Post } from '@/types';

interface BlogPostFeedProps {
    isFallback: boolean;
    isLoading: boolean;
    posts: Post[];
}

export function BlogPostFeed({
    isFallback,
    isLoading,
    posts,
}: BlogPostFeedProps) {
    if (isLoading) {
        return (
            <div className="space-y-6">
                <SectionHeading
                    title="Recent Posts"
                    description="Dang tai bai viet moi nhat cho trang chu blog."
                />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }, (_, index) => (
                        <div
                            key={index}
                            className="overflow-hidden rounded-2xl border border-gray-100 bg-surface-light dark:border-gray-800 dark:bg-surface-dark"
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
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SectionHeading
                title="Recent Posts"
                description={
                    isFallback
                        ? 'Dang hien du lieu mau trong luc ket noi API bai viet.'
                        : 'Nhung bai viet moi nhat ve CI/CD, automation, cloud va observability.'
                }
                action={
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
                    >
                        View All
                        <ArrowRight className="size-4" />
                    </Link>
                }
            />
            {posts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-surface-light p-8 text-center dark:border-gray-700 dark:bg-surface-dark">
                    <h3 className="text-lg font-semibold text-text-main dark:text-white">
                        No posts match this topic yet
                    </h3>
                    <p className="mt-2 text-sm text-text-sub dark:text-gray-400">
                        Try another topic or switch back to All to browse the
                        latest published articles.
                    </p>
                </div>
            ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>
            )}
        </div>
    );
}
