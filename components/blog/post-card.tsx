import Link from 'next/link';
import type { Post } from '@/types';

interface PostCardProps {
    post: Post;
}

export function PostCard({ post }: PostCardProps) {
    const categoryName = post.category?.name || 'General';

    return (
        <article className="flex flex-col group bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
            <div className="w-full aspect-video bg-gray-200 relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{
                        backgroundImage: `url("${post.featuredImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBorMuWccEsO-365PD-J3ATEJq8PhpyU_A3oQjRX1bRo89MR3qecATcyBlzJfrlU7gvmdUVmrvYoZRlf6caYDPyJTI8YWDOEd4vbt39NM6A2MJwk8h6OMS07FoiPiz6xzq35_PXPXaXD6eAy03p1nFxYGlKmDP7fso1x1UfSYLyUWrph75ulp8rbWi9phwZ2VoNLu9jQOiF1sC8JZIsOQBa-nGWDa1FfBFjqjyLJ-h0MXOsHWMMMnqDS_hVJ1PAU7YjWx9UAPPG7u8c'}")`,
                    }}
                />
                <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-primary">
                    {categoryName}
                </div>
            </div>
            <div className="p-5 flex flex-col gap-3 flex-1">
                <Link href={`/blog/${post.slug}`}>
                    <h3 className="text-lg font-bold text-text-main dark:text-white leading-snug group-hover:text-primary transition-colors">
                        {post.title}
                    </h3>
                </Link>
                <p className="text-sm text-text-sub dark:text-gray-400 line-clamp-2">
                    {post.excerpt || 'Discover the latest insights and best practices in DevOps and cloud-native technologies.'}
                </p>
                <div className="mt-auto pt-2 flex items-center gap-2 text-xs text-text-sub font-medium">
                    <span>{post.readingTime || 5} min read</span>
                    <span className="size-1 rounded-full bg-gray-300" />
                    <span>
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })}
                    </span>
                </div>
            </div>
        </article>
    );
}
