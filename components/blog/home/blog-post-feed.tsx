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

const HOME_POST_LIMIT = 9;

export function BlogPostFeed({
    isFallback,
    isLoading,
    posts,
}: BlogPostFeedProps) {
    const visiblePosts = posts.slice(0, HOME_POST_LIMIT);
    const hasMorePosts = posts.length > HOME_POST_LIMIT;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <SectionHeading
                    title="Recent Posts"
                    description="Dang tai bai viet moi nhat cho trang chu blog."
                />
                <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 9 }, (_, index) => (
                        <div
                            key={index}
                            className="overflow-hidden rounded-[28px] border border-gray-100 bg-surface-light dark:border-gray-800 dark:bg-surface-dark"
                        >
                            <Skeleton className="h-60 w-full rounded-none md:h-64" />
                            <div className="space-y-4 p-6">
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
                        href="/blog"
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
                <>
                    <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
                        {visiblePosts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                    {hasMorePosts ? (
                        <div className="flex justify-center pt-2">
                            <Link
                                href="/blog"
                                className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                            >
                                View all posts
                            </Link>
                        </div>
                    ) : null}
                </>
            )}
        </div>
    );
}
