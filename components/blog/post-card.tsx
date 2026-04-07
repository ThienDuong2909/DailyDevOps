import Link from 'next/link';
import type { Post } from '@/types';
import { getImageUrl } from '@/lib/utils';

interface PostCardProps {
    post: Post;
    imageClassName?: string;
}

export function PostCard({ post, imageClassName }: PostCardProps) {
    const categoryName = post.category?.name || 'General';
    const publishedLabel = new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    const imageUrl =
        getImageUrl(post.featuredImage) ||
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBorMuWccEsO-365PD-J3ATEJq8PhpyU_A3oQjRX1bRo89MR3qecATcyBlzJfrlU7gvmdUVmrvYoZRlf6caYDPyJTI8YWDOEd4vbt39NM6A2MJwk8h6OMS07FoiPiz6xzq35_PXPXaXD6eAy03p1nFxYGlKmDP7fso1x1UfSYLyUWrph75ulp8rbWi9phwZ2VoNLu9jQOiF1sC8JZIsOQBa-nGWDa1FfBFjqjyLJ-h0MXOsHWMMMnqDS_hVJ1PAU7YjWx9UAPPG7u8c';

    return (
        <article className="theme-panel group flex h-full flex-col overflow-visible rounded-[28px] border border-transparent transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
            <div className="relative">
                <div className={`relative h-60 w-full overflow-hidden rounded-t-[28px] bg-gradient-to-br from-slate-100 via-white to-cyan-50 p-3 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 md:h-64 ${imageClassName || ''}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt={post.title}
                        className="h-full w-full rounded-[20px] object-contain object-center transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                </div>
                <Link
                    href={post.category?.slug ? `/category/${post.category.slug}` : '/blog'}
                    className="absolute left-5 top-full z-10 inline-flex -translate-y-1/2 items-center rounded-full border border-white/70 bg-cyan-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg shadow-cyan-500/20 transition-transform hover:scale-[1.02]"
                >
                    {categoryName}
                </Link>
            </div>
            <div className="flex flex-1 flex-col gap-4 px-6 pb-6 pt-8">
                <div className="theme-muted flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                    <span>{publishedLabel}</span>
                    <span className="size-1 rounded-full bg-gray-300" />
                    <span>{post.viewCount || 0} views</span>
                    <span className="size-1 rounded-full bg-gray-300" />
                    <span>{post.readingTime || 5} min read</span>
                </div>
                <Link href={`/blog/${post.slug}`}>
                    <h3 className="text-[1.55rem] font-black leading-[1.15] tracking-tight text-[color:var(--text-main-theme)] transition-colors group-hover:text-primary">
                        {post.title}
                    </h3>
                </Link>
                <p className="theme-muted line-clamp-3 text-[0.95rem] leading-7">
                    {post.excerpt || 'Discover the latest insights and best practices in DevOps and cloud-native technologies.'}
                </p>
                <div className="theme-muted mt-auto flex flex-wrap items-center gap-2 border-t border-[color:var(--border-theme)]/60 pt-4 text-sm font-medium">
                    <span>{post.author.firstName} {post.author.lastName}</span>
                    <span className="size-1 rounded-full bg-gray-300" />
                    <span>{publishedLabel}</span>
                </div>
                <div className="pt-1">
                    <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
                    >
                        Read article
                        <span className="material-symbols-outlined !text-[18px]">arrow_forward</span>
                    </Link>
                </div>
            </div>
        </article>
    );
}
