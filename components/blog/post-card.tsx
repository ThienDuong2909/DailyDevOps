import Link from 'next/link';
import type { Post } from '@/types';
import { getImageUrl } from '@/lib/utils';

interface PostCardProps {
    post: Post;
}

export function PostCard({ post }: PostCardProps) {
    const categoryName = post.category?.name || 'General';

    return (
        <article className="theme-panel group flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
            <div className="relative aspect-video w-full overflow-hidden bg-[color:var(--surface-strong)]">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{
                        backgroundImage: `url("${getImageUrl(post.featuredImage) || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBorMuWccEsO-365PD-J3ATEJq8PhpyU_A3oQjRX1bRo89MR3qecATcyBlzJfrlU7gvmdUVmrvYoZRlf6caYDPyJTI8YWDOEd4vbt39NM6A2MJwk8h6OMS07FoiPiz6xzq35_PXPXaXD6eAy03p1nFxYGlKmDP7fso1x1UfSYLyUWrph75ulp8rbWi9phwZ2VoNLu9jQOiF1sC8JZIsOQBa-nGWDa1FfBFjqjyLJ-h0MXOsHWMMMnqDS_hVJ1PAU7YjWx9UAPPG7u8c'}")`,
                    }}
                />
                <Link
                    href={post.category?.slug ? `/category/${post.category.slug}` : '/blog'}
                    className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-primary backdrop-blur-sm transition-colors hover:bg-white dark:bg-black/70"
                >
                    {categoryName}
                </Link>
            </div>
            <div className="p-5 flex flex-col gap-3 flex-1">
                <Link href={`/blog/${post.slug}`}>
                    <h3 className="text-lg font-bold leading-snug text-[color:var(--text-main-theme)] transition-colors group-hover:text-primary">
                        {post.title}
                    </h3>
                </Link>
                <p className="theme-muted line-clamp-2 text-sm">
                    {post.excerpt || 'Discover the latest insights and best practices in DevOps and cloud-native technologies.'}
                </p>
                <div className="theme-muted mt-auto flex items-center gap-2 pt-2 text-xs font-medium">
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
