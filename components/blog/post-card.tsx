import Link from 'next/link';
import Image from 'next/image';
import type { Post } from '@/types';
import { getImageUrl } from '@/lib/utils';

interface PostCardProps {
    post: Post;
    imageClassName?: string;
}

function formatPublishedLabel(post: Post) {
    const candidate = post.publishedAt || post.createdAt || post.updatedAt;

    if (!candidate) {
        return 'Gan day';
    }

    const parsed = new Date(candidate);

    if (Number.isNaN(parsed.getTime())) {
        return 'Gan day';
    }

    return parsed.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export function PostCard({ post, imageClassName }: PostCardProps) {
    const categoryName = post.category?.name || 'General';
    const publishedLabel = formatPublishedLabel(post);
    const imageUrl =
        getImageUrl(post.featuredImage) ||
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBorMuWccEsO-365PD-J3ATEJq8PhpyU_A3oQjRX1bRo89MR3qecATcyBlzJfrlU7gvmdUVmrvYoZRlf6caYDPyJTI8YWDOEd4vbt39NM6A2MJwk8h6OMS07FoiPiz6xzq35_PXPXaXD6eAy03p1nFxYGlKmDP7fso1x1UfSYLyUWrph75ulp8rbWi9phwZ2VoNLu9jQOiF1sC8JZIsOQBa-nGWDa1FfBFjqjyLJ-h0MXOsHWMMMnqDS_hVJ1PAU7YjWx9UAPPG7u8c';

    const authorName =
        [post.author?.firstName, post.author?.lastName]
            .filter(Boolean)
            .join(' ')
            .trim() || 'DevOps Daily';
    const authorAvatar = post.author?.avatar;
    const initials = `${post.author?.firstName?.[0] || 'D'}${post.author?.lastName?.[0] || 'D'}`.toUpperCase();

    return (
        <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-[var(--surface-elevated)] shadow-[0_2px_12px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
            <div className={`relative aspect-[16/9] w-full overflow-hidden ${imageClassName || ''}`}>
                <Link href={`/${post.slug}`} className="block h-full w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                </Link>

                <Link
                    href={post.category?.slug ? `/category/${post.category.slug}` : '/blog'}
                    className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-105"
                >
                    <svg className="size-3" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 1.5l1.85 4.15L14.5 6.5l-3.35 2.95.9 4.55L8 11.65 3.95 14l.9-4.55L1.5 6.5l4.65-.85L8 1.5z" />
                    </svg>
                    {categoryName}
                </Link>
            </div>

            <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
                <Link href={`/${post.slug}`} className="block">
                    <h3 className="line-clamp-2 text-[1.05rem] font-extrabold leading-snug tracking-tight text-[var(--text-main-theme)] transition-colors group-hover:text-primary">
                        {post.title}
                    </h3>
                </Link>

                <div className="mt-auto flex items-center gap-2.5 pt-1">
                    {authorAvatar ? (
                        <Image
                            src={getImageUrl(authorAvatar) || ''}
                            alt={authorName}
                            width={28}
                            height={28}
                            className="size-7 rounded-full object-cover ring-2 ring-white/80 dark:ring-gray-800/80"
                        />
                    ) : (
                        <span className="inline-flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-cyan-500/80 text-[10px] font-bold text-white ring-2 ring-white/80 dark:ring-gray-800/80">
                            {initials}
                        </span>
                    )}
                    <div className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted-theme)]">
                        <span className="font-semibold text-[var(--text-main-theme)]">{authorName}</span>
                        <span className="text-[var(--text-soft-theme)]">|</span>
                        <span>{publishedLabel}</span>
                    </div>
                </div>
            </div>
        </article>
    );
}
