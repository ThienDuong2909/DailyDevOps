'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';
import { PostCard } from '@/components/blog/post-card';
import type { PostWithComments, Post } from '@/types';

interface TocItem {
    id: string;
    text: string;
    level: number;
}

export default function BlogDetailPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [post, setPost] = useState<PostWithComments | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [readingProgress, setReadingProgress] = useState(0);
    const [tocItems, setTocItems] = useState<TocItem[]>([]);
    const [activeTocId, setActiveTocId] = useState('');
    const contentRef = useRef<HTMLDivElement>(null);

    // Reading progress bar
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            setReadingProgress(Math.min(100, progress));

            // Active TOC tracking
            if (contentRef.current) {
                const headings = contentRef.current.querySelectorAll('h2, h3');
                let currentId = '';
                headings.forEach((heading) => {
                    const rect = heading.getBoundingClientRect();
                    if (rect.top <= 120) {
                        currentId = heading.id;
                    }
                });
                if (currentId) setActiveTocId(currentId);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Extract TOC from content after render
    useEffect(() => {
        if (contentRef.current) {
            const headings = contentRef.current.querySelectorAll('h2, h3');
            const items: TocItem[] = [];
            headings.forEach((heading, i) => {
                const id = heading.id || `heading-${i}`;
                heading.id = id;
                items.push({
                    id,
                    text: heading.textContent || '',
                    level: heading.tagName === 'H2' ? 2 : 3,
                });
            });
            setTocItems(items);
        }
    }, [post]);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const postData = await apiClient.get<PostWithComments>(`/api/v1/posts/slug/${slug}`);
                setPost(postData);

                // Fetch related posts
                if (postData.id) {
                    const related = await apiClient.get<Post[]>(`/api/v1/posts/${postData.id}/related?limit=3`);
                    setRelatedPosts(related);
                }
            } catch (error) {
                console.error('Failed to fetch post:', error);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchPost();
        }
    }, [slug]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">Post Not Found</h1>
                    <Link href="/blog" className="text-primary hover:underline">
                        Back to Blog
                    </Link>
                </div>
            </div>
        );
    }

    const authorName = `${post.author.firstName} ${post.author.lastName}`;

    return (
        <div className="min-h-screen bg-white dark:bg-background-dark">
            {/* Reading Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent">
                <div
                    className="h-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-150 ease-out shadow-lg shadow-primary/20"
                    style={{ width: `${readingProgress}%` }}
                />
            </div>
            {/* Article Header */}
            <section className="max-w-4xl mx-auto px-4 lg:px-8 pt-10">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-[#617589] mb-6">
                    <Link href="/blog" className="hover:text-primary">Blog</Link>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    {post.category && (
                        <>
                            <Link href={`/blog/category/${post.category.slug}`} className="hover:text-primary">
                                {post.category.name}
                            </Link>
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </>
                    )}
                    <span className="text-[#111418] dark:text-white truncate">{post.title}</span>
                </nav>

                {/* Title & Meta */}
                <h1 className="text-3xl md:text-5xl font-black text-[#111418] dark:text-white leading-tight mb-6">
                    {post.title}
                </h1>

                <div className="flex items-center gap-4 mb-8">
                    <div
                        className="size-12 rounded-full bg-cover bg-center border-2 border-border-dark"
                        style={{
                            backgroundImage: `url("${post.author.avatar || '/avatar-placeholder.jpg'}")`,
                        }}
                    />
                    <div>
                        <h4 className="font-bold text-[#111418] dark:text-white">{authorName}</h4>
                        <p className="text-sm text-[#617589]">
                            {formatDate(post.publishedAt || post.createdAt)} · {post.readingTime || 5} min read
                        </p>
                    </div>
                </div>

                {/* Featured Image */}
                {post.featuredImage && (
                    <div
                        className="aspect-video w-full rounded-xl bg-cover bg-center shadow-lg mb-10"
                        style={{ backgroundImage: `url("${post.featuredImage}")` }}
                    />
                )}
            </section>

            {/* Article Content */}
            <section className="max-w-4xl mx-auto px-4 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content */}
                    <article className="lg:col-span-8">
                        <div
                            ref={contentRef}
                            className="prose prose-lg dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-[#f0f2f4] dark:border-gray-800">
                                {post.tags.map((tag) => (
                                    <Link
                                        key={tag.id}
                                        href={`/blog/tag/${tag.slug}`}
                                        className="px-3 py-1 bg-[#f0f2f4] dark:bg-surface-dark text-sm text-[#617589] rounded-full hover:bg-primary hover:text-white transition-colors"
                                    >
                                        #{tag.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Author Bio */}
                        <div className="mt-10 p-6 bg-[#f9fafb] dark:bg-surface-dark rounded-xl">
                            <div className="flex items-start gap-4">
                                <div
                                    className="size-16 rounded-full bg-cover bg-center flex-shrink-0"
                                    style={{
                                        backgroundImage: `url("${post.author.avatar || '/avatar-placeholder.jpg'}")`,
                                    }}
                                />
                                <div>
                                    <h4 className="font-bold text-lg text-[#111418] dark:text-white mb-1">
                                        {authorName}
                                    </h4>
                                    <p className="text-[#617589] text-sm">
                                        {post.author.bio || 'DevOps enthusiast sharing insights on cloud-native technologies.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4">
                        <div className="sticky top-24 space-y-8">
                            {/* Table of Contents */}
                            <div className="p-5 bg-[#f9fafb] dark:bg-surface-dark rounded-xl">
                                <h4 className="font-bold text-[#111418] dark:text-white mb-4">On this page</h4>
                                {tocItems.length > 0 ? (
                                    <ul className="space-y-2 text-sm">
                                        {tocItems.map((item) => (
                                            <li key={item.id} style={{ paddingLeft: item.level === 3 ? '1rem' : '0' }}>
                                                <a
                                                    href={`#${item.id}`}
                                                    className={`hover:text-primary transition-colors ${
                                                        activeTocId === item.id ? 'text-primary font-medium' : 'text-[#617589]'
                                                    }`}
                                                >
                                                    {item.text}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <ul className="space-y-2 text-sm">
                                        <li><span className="text-[#617589]">No headings found</span></li>
                                    </ul>
                                )}
                            </div>

                            {/* Share */}
                            <div className="p-5 bg-[#f9fafb] dark:bg-surface-dark rounded-xl">
                                <h4 className="font-bold text-[#111418] dark:text-white mb-4">Share this article</h4>
                                <div className="flex gap-3">
                                    <button className="size-10 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded-lg flex items-center justify-center hover:bg-[#1DA1F2] hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-lg">share</span>
                                    </button>
                                    <button className="size-10 bg-[#0077B5]/10 text-[#0077B5] rounded-lg flex items-center justify-center hover:bg-[#0077B5] hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-lg">link</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>

            {/* Comments Section */}
            <section className="max-w-4xl mx-auto px-4 lg:px-8 mt-16">
                <h3 className="text-2xl font-bold text-[#111418] dark:text-white mb-6">
                    Comments ({post.comments?.length || 0})
                </h3>

                {/* Comment Form */}
                <div className="mb-8 p-6 bg-[#f9fafb] dark:bg-surface-dark rounded-xl">
                    <textarea
                        className="w-full p-4 bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-gray-700 rounded-lg text-[#111418] dark:text-white placeholder:text-[#617589] focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Leave a comment..."
                        rows={4}
                    />
                    <button className="mt-4 px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                        Post Comment
                    </button>
                </div>

                {/* Comments List */}
                <div className="space-y-6">
                    {post.comments?.map((comment) => (
                        <div key={comment.id} className="flex gap-4">
                            <div className="size-10 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white font-bold">
                                {comment.user
                                    ? getInitials(`${comment.user.firstName} ${comment.user.lastName}`)
                                    : getInitials(comment.authorName || 'Anonymous')}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-[#111418] dark:text-white">
                                        {comment.user
                                            ? `${comment.user.firstName} ${comment.user.lastName}`
                                            : comment.authorName || 'Anonymous'}
                                    </span>
                                    <span className="text-sm text-[#617589]">
                                        {formatDate(comment.createdAt)}
                                    </span>
                                </div>
                                <p className="text-[#617589]">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <section className="max-w-6xl mx-auto px-4 lg:px-8 mt-16 mb-16">
                    <h3 className="text-2xl font-bold text-[#111418] dark:text-white mb-8">
                        Related Articles
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {relatedPosts.map((relatedPost) => (
                            <PostCard key={relatedPost.id} post={relatedPost} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
