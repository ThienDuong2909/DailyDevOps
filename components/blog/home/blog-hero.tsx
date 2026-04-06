import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import type { Post } from '@/types';

interface BlogHeroProps {
    post: Post | null;
}

export function BlogHero({ post }: BlogHeroProps) {
    if (!post) {
        return null;
    }

    return (
        <section className="@container w-full">
            <div className="grid gap-6 rounded-3xl border border-cyan-500/10 bg-surface-light p-6 shadow-sm dark:border-cyan-400/10 dark:bg-surface-dark md:grid-cols-[1.1fr_0.9fr] md:p-8 lg:p-10">
                <div className="flex flex-col justify-center gap-5">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-500">
                        <Sparkles className="size-4" />
                        Featured Article
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-black leading-tight tracking-[-0.04em] text-text-main dark:text-white md:text-4xl lg:text-5xl">
                            {post.title}
                        </h1>
                        <p className="max-w-2xl text-base leading-7 text-text-sub dark:text-gray-400 md:text-lg">
                            {post.excerpt ||
                                'Discover the latest insights and best practices in DevOps.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-sub dark:text-gray-400">
                        <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })}</span>
                        <span className="size-1 rounded-full bg-current opacity-40" />
                        <span>{post.readingTime || 5} min read</span>
                        <span className="size-1 rounded-full bg-current opacity-40" />
                        <span>{post.category?.name || 'General'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <Link
                            href={`/blog/${post.slug}`}
                            className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark"
                        >
                            Read Article
                            <ArrowRight className="size-4" />
                        </Link>
                        <Link
                            href="/blog"
                            className="inline-flex h-12 items-center rounded-xl border border-gray-200 px-5 text-sm font-semibold text-text-main transition-colors hover:border-cyan-500 hover:text-cyan-500 dark:border-gray-700 dark:text-white"
                        >
                            Browse All Articles
                        </Link>
                    </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-lg dark:border-gray-800">
                    <div
                        className="aspect-video bg-cover bg-center transition-transform duration-700 hover:scale-105"
                        style={{
                            backgroundImage: `url("${getImageUrl(post.featuredImage)}")`,
                        }}
                    />
                </div>
            </div>
        </section>
    );
}
