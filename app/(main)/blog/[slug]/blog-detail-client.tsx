'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { PostDetailSkeleton } from '@/components/blog/detail/post-detail-skeleton';
import { useAuthStore } from '@/hooks/use-auth';
import { formatDate, getImageUrl, getInitials } from '@/lib/utils';
import type { Post, PostWithComments } from '@/types';

interface TocItem {
    id: string;
    text: string;
    level: number;
}

interface HeadingNormalizationResult {
    html: string;
    toc: TocItem[];
}

function unwrap<T>(payload: unknown, fallback: T): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return ((payload as { data?: T }).data ?? fallback) as T;
    }
    return (payload as T) ?? fallback;
}

function slugifyHeading(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\u00C0-\u024f\s-]/gi, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function normalizeContentHeadings(html: string): HeadingNormalizationResult {
    if (typeof window === 'undefined' || !html.trim()) {
        return { html, toc: [] };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const toc: TocItem[] = [];

    Array.from(doc.querySelectorAll('h1, h2, h3')).forEach((node, index) => {
        const text = (node.textContent || '').trim();
        if (!text) return;

        const id = `${slugifyHeading(text) || 'heading'}-${index}`;
        const level = node.tagName === 'H3' ? 3 : 2;
        node.setAttribute('id', id);

        if (node.tagName !== 'H1') {
            const anchor = doc.createElement('a');
            anchor.setAttribute('href', `#${id}`);
            anchor.setAttribute('class', 'heading-anchor-link');
            anchor.setAttribute('aria-label', `Jump to ${text}`);
            anchor.textContent = '#';
            node.appendChild(anchor);

            toc.push({ id, text, level });
        }
    });

    return {
        html: doc.body.innerHTML,
        toc,
    };
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-5 dark:border-gray-800 dark:bg-surface-dark">
            <h3 className="mb-4 text-base font-bold text-[#111418] dark:text-white">{title}</h3>
            {children}
        </div>
    );
}

/**
 * Generates JSON-LD structured data for a blog post.
 * This helps search engines understand the content better.
 */
function BlogPostJsonLd({ post, postUrl }: { post: PostWithComments; postUrl: string }) {
    const authorName = `${post.author.firstName} ${post.author.lastName}`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt || post.title,
        url: postUrl,
        datePublished: post.publishedAt || post.createdAt,
        dateModified: post.updatedAt || post.publishedAt || post.createdAt,
        author: {
            '@type': 'Person',
            name: authorName,
        },
        publisher: {
            '@type': 'Organization',
            name: 'DevOps Blog',
            url: 'https://blog.thienduong.info',
        },
        ...(post.featuredImage && {
            image: {
                '@type': 'ImageObject',
                url: post.featuredImage,
            },
        }),
        ...(post.category && {
            articleSection: post.category.name,
        }),
        keywords: post.tags?.map((t) => t.name).join(', '),
        wordCount: post.content ? post.content.split(/\s+/).length : undefined,
        ...(post.readingTime && {
            timeRequired: `PT${post.readingTime}M`,
        }),
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': postUrl,
        },
        ...(post.comments?.length && {
            commentCount: post.comments.length,
            comment: post.comments.slice(0, 5).map((c) => ({
                '@type': 'Comment',
                text: c.content,
                dateCreated: c.createdAt,
                author: {
                    '@type': 'Person',
                    name: c.user
                        ? `${c.user.firstName} ${c.user.lastName}`
                        : c.authorName || 'Anonymous',
                },
            })),
        }),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}

/**
 * Generates BreadcrumbList JSON-LD for better search result display.
 */
function BreadcrumbJsonLd({
    post,
    siteUrl,
}: {
    post: PostWithComments;
    siteUrl: string;
}) {
    const items = [
        { name: 'Home', url: siteUrl },
        { name: 'Blog', url: `${siteUrl}/blog` },
    ];

    if (post.category) {
        items.push({
            name: post.category.name,
            url: `${siteUrl}/category/${post.category.slug}`,
        });
    }

    items.push({
        name: post.title,
        url: `${siteUrl}/blog/${post.slug}`,
    });

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}

export default function BlogDetailClient() {
    const { slug } = useParams<{ slug: string }>();
    const { user, isAuthenticated, initializeAuth } = useAuthStore();
    const [post, setPost] = useState<PostWithComments | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
    const [popularPosts, setPopularPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [progress, setProgress] = useState(0);
    const [activeTocId, setActiveTocId] = useState('');
    const [form, setForm] = useState({ authorName: '', authorEmail: '', content: '' });

    const contentRef = useRef<HTMLDivElement>(null);
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://blog.thienduong.info';
    const postUrl = `${siteUrl}/blog/${slug}`;

    const scrollToHeading = useCallback((headingId: string, options?: { updateHash?: boolean }) => {
        const heading = document.getElementById(headingId);
        if (!heading) return;

        if (options?.updateHash !== false) {
            const targetUrl = `${window.location.pathname}#${headingId}`;
            window.history.replaceState(window.history.state ?? {}, '', targetUrl);
        }

        heading.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });

        setActiveTocId(headingId);
    }, []);

    useEffect(() => {
        void initializeAuth();
    }, [initializeAuth]);

    useEffect(() => {
        const onScroll = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(Math.min(100, max > 0 ? (window.scrollY / max) * 100 : 0));
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setErrorMessage('');
                const postRes = await apiClient.get(`/api/v1/posts/slug/${slug}`);
                const postData = unwrap<PostWithComments | null>(postRes, null);
                if (!postData) throw new Error('missing post');
                setPost(postData);
                const [relatedRes, popularRes] = await Promise.all([
                    apiClient.get(`/api/v1/posts/${postData.id}/related?limit=3`),
                    apiClient.get('/api/v1/posts/published?limit=5&sortBy=viewCount&sortOrder=desc'),
                ]);
                setRelatedPosts(unwrap<Post[]>(relatedRes, []));
                setPopularPosts(unwrap<Post[]>(popularRes, []).filter((item) => item.slug !== postData.slug).slice(0, 4));
            } catch {
                setErrorMessage('Khong the tai bai viet nay luc nay.');
                setPost(null);
            } finally {
                setLoading(false);
            }
        };
        if (slug) void fetchData();
    }, [slug]);

    const handleContentClick = useCallback((event: React.MouseEvent) => {
        const target = event.target as HTMLElement;
        const button = target.closest('.copy-code-btn');
        if (!button) return;
        const code = button.closest('.macos-mockup')?.querySelector('code');
        if (!code) return;
        navigator.clipboard.writeText(code.textContent || '').then(() => {
            const html = button.innerHTML;
            button.innerHTML = 'Copied!';
            setTimeout(() => {
                button.innerHTML = html;
            }, 1600);
        });
    }, []);

    const handleCommentSubmit = async () => {
        if (!post) return;
        if (!form.content.trim()) return toast.error('Noi dung comment khong duoc de trong');
        if (!isAuthenticated && (!form.authorName.trim() || !form.authorEmail.trim())) {
            return toast.error('Vui long nhap ten va email de gui comment');
        }
        try {
            setSubmitting(true);
            await apiClient.post('/api/v1/comments', {
                postId: post.id,
                content: form.content.trim(),
                authorName: isAuthenticated ? undefined : form.authorName.trim(),
                authorEmail: isAuthenticated ? undefined : form.authorEmail.trim(),
            });
            const commentsRes = await apiClient.get(`/api/v1/comments/post/${post.id}`);
            setPost((prev) => (prev ? { ...prev, comments: unwrap<any[]>(commentsRes, []) } : prev));
            setForm({ authorName: '', authorEmail: '', content: '' });
            toast.success('Comment da duoc gui va dang cho duyet');
        } catch {
            toast.error('Khong the gui comment luc nay');
        } finally {
            setSubmitting(false);
        }
    };

    const handleShare = async (mode: 'native' | 'copy') => {
        if (!post) return;
        if (mode === 'native' && navigator.share) {
            try {
                await navigator.share({ title: post.title, text: post.excerpt || post.title, url: postUrl });
                return;
            } catch {}
        }
        try {
            await navigator.clipboard.writeText(postUrl);
            toast.success('Da copy link bai viet');
        } catch {
            toast.error('Khong the copy link bai viet');
        }
    };

    const primaryContent = post?.contentHtml || post?.content || '';

    const transformedContent = primaryContent
        ? primaryContent
            .replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '')
            .replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/gi, (_m, attrs, content) => {
              const withClass = attrs.includes('class=')
                  ? attrs.replace(/class=["'](.*?)["']/, 'class="$1 !bg-transparent !p-0 !text-[#e2e8f0] !border-none !shadow-none"')
                  : `${attrs} class="!bg-transparent !p-0 !text-[#e2e8f0] !border-none !shadow-none"`;
              return `<div class="macos-mockup relative rounded-xl overflow-hidden bg-[#1e293b] my-8 shadow-xl border border-[#283039] font-mono group"><div class="flex items-center justify-between pl-4 pr-3 py-2 bg-[#0f172a] border-b border-[#283039]"><div class="flex gap-2"><div class="size-3 rounded-full bg-[#ff5f56]"></div><div class="size-3 rounded-full bg-[#ffbd2e]"></div><div class="size-3 rounded-full bg-[#27c93f]"></div></div><button class="copy-code-btn flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[#9dabb9] hover:text-white transition-colors text-[13px] font-semibold border border-white/5 opacity-0 group-hover:opacity-100 focus:opacity-100">Copy</button></div><div class="code-wrapper-scroll overflow-x-auto text-[13px] sm:text-sm leading-relaxed whitespace-pre font-mono text-[#e2e8f0]"><pre class="!bg-transparent !m-0 !p-5 !shadow-none !rounded-none !border-none"><code${withClass}>${content}</code></pre></div></div>`;
            })
        : '';

    const normalizedContent = useMemo(() => normalizeContentHeadings(transformedContent), [transformedContent]);
    const formattedContent = normalizedContent.html;
    const derivedTocItems = normalizedContent.toc;
    const effectiveActiveTocId = activeTocId || derivedTocItems[0]?.id || '';

    useEffect(() => {
        if (!activeTocId && derivedTocItems[0]?.id) {
            setActiveTocId(derivedTocItems[0].id);
        }
    }, [activeTocId, derivedTocItems]);

    const tocNavRef = useRef<HTMLUListElement>(null);

    // Auto-scroll active TOC item into view within the sidebar
    useEffect(() => {
        if (!activeTocId || !tocNavRef.current) return;
        const activeBtn = tocNavRef.current.querySelector<HTMLElement>(`[data-toc-id="${activeTocId}"]`);
        if (activeBtn) {
            activeBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [activeTocId]);

    useEffect(() => {
        if (!contentRef.current || !derivedTocItems.length) return;

        let rafId = 0;
        let setupTimer: ReturnType<typeof setTimeout>;
        let isCleanedUp = false;

        const setupScrollSpy = () => {
            const root = contentRef.current;
            if (!root || isCleanedUp) return;

            const headings = Array.from(root.querySelectorAll<HTMLElement>('h2[id], h3[id]'));
            if (!headings.length) return;

            // Attach anchor click handlers
            headings.forEach((node) => {
                const anchor = node.querySelector('.heading-anchor-link') as HTMLAnchorElement | null;
                if (anchor) {
                    anchor.onclick = (e) => { e.preventDefault(); scrollToHeading(node.id); };
                }
            });

            // Restore URL hash position on first load
            const hash = window.location.hash.replace('#', '');
            if (hash && headings.find((h) => h.id === hash)) {
                scrollToHeading(hash, { updateHash: false });
            } else {
                setActiveTocId(headings[0].id);
            }

            const syncActiveHeading = () => {
                const headerHeight = document.querySelector('header')?.getBoundingClientRect().height ?? 72;
                const threshold = headerHeight + 20;

                let activeId = headings[0].id;
                for (const h of headings) {
                    if (h.getBoundingClientRect().top <= threshold) {
                        activeId = h.id;
                    } else {
                        break;
                    }
                }

                const scrollTop =
                    (document.scrollingElement?.scrollTop) ??
                    document.documentElement.scrollTop ??
                    document.body.scrollTop ??
                    window.scrollY;
                const scrollHeight =
                    (document.scrollingElement?.scrollHeight) ??
                    document.documentElement.scrollHeight;
                const clientHeight = window.innerHeight;

                if (Math.ceil(scrollTop + clientHeight) >= scrollHeight - 4) {
                    activeId = headings[headings.length - 1].id;
                }

                setActiveTocId((prev) => (prev === activeId ? prev : activeId));

                const nextHash = `#${activeId}`;
                if (window.location.hash !== nextHash) {
                    window.history.replaceState(window.history.state ?? {}, '', `${window.location.pathname}${nextHash}`);
                }
            };

            syncActiveHeading();

            const onScroll = () => {
                cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(syncActiveHeading);
            };

            window.addEventListener('scroll', onScroll, { passive: true, capture: true });
            document.addEventListener('scroll', onScroll, { passive: true, capture: true });
            window.addEventListener('resize', syncActiveHeading, { passive: true });

            const pollInterval = setInterval(syncActiveHeading, 150);

            const dispose = () => {
                cancelAnimationFrame(rafId);
                clearInterval(pollInterval);
                window.removeEventListener('scroll', onScroll, { capture: true });
                document.removeEventListener('scroll', onScroll, { capture: true });
                window.removeEventListener('resize', syncActiveHeading);
            };

            (setupScrollSpy as unknown as { dispose?: () => void }).dispose = dispose;
        };

        setupTimer = setTimeout(() => {
            setupScrollSpy();
        }, 300);

        return () => {
            isCleanedUp = true;
            clearTimeout(setupTimer);
            cancelAnimationFrame(rafId);
            const dispose = (setupScrollSpy as unknown as { dispose?: () => void }).dispose;
            dispose?.();
        };
    }, [derivedTocItems, scrollToHeading]);

    useEffect(() => {
        const onHashChange = () => {
            const currentHash = window.location.hash.replace('#', '');
            if (currentHash) {
                scrollToHeading(currentHash, { updateHash: false });
            }
        };

        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, [scrollToHeading]);

    if (loading) return <PostDetailSkeleton />;

    if (!post) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="mb-4 text-4xl font-bold text-white">{errorMessage || 'Post Not Found'}</h1>
                    <Link href="/" className="text-primary hover:underline">Back to Blog</Link>
                </div>
            </div>
        );
    }

    const authorName = `${post.author.firstName} ${post.author.lastName}`;

    return (
        <div className="min-h-screen bg-white dark:bg-background-dark">
            {/* JSON-LD Structured Data */}
            <BlogPostJsonLd post={post} postUrl={postUrl} />
            <BreadcrumbJsonLd post={post} siteUrl={siteUrl} />

            <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-transparent">
                <div className="h-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-150 ease-out" style={{ width: `${progress}%` }} />
            </div>

            <section className="mx-auto max-w-[1280px] px-4 pt-10 lg:px-8">
                <nav className="mb-6 flex items-center gap-2 text-sm text-[#617589]">
                    <Link href="/" className="hover:text-primary">Blog</Link>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    {post.category ? <><span>{post.category.name}</span><span className="material-symbols-outlined text-sm">chevron_right</span></> : null}
                    <span className="truncate text-[#111418] dark:text-white">{post.title}</span>
                </nav>

                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
                    <div className="min-w-0">
                        <h1 className="mb-5 text-[30px] font-bold leading-[1.35] text-[#111418] dark:text-white">{post.title}</h1>
                        <div className="mb-8 flex items-center gap-4 border-b border-[#e5e7eb] pb-6 dark:border-gray-800">
                            <div className="size-12 rounded-full border-2 border-border-dark bg-cover bg-center" style={{ backgroundImage: `url("${getImageUrl(post.author.avatar) || '/avatar-placeholder.jpg'}")` }} />
                            <div>
                                <h4 className="font-semibold text-[#111418] dark:text-white">{authorName}</h4>
                                <p className="text-sm text-[#617589]">{formatDate(post.publishedAt || post.createdAt)} · {post.readingTime || 5} min read · {post.viewCount || 0} views</p>
                            </div>
                        </div>

                        <div ref={contentRef} className="article-copy max-w-none" onClick={handleContentClick} dangerouslySetInnerHTML={{ __html: formattedContent }} />

                        <section className="mt-14">
                            <h3 className="mb-6 text-[22px] font-bold text-[#111418] dark:text-white">Discussion</h3>
                            <div className="mb-8 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-6 dark:border-gray-800 dark:bg-surface-dark">
                                {!isAuthenticated ? (
                                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <input className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-[#111418] focus:border-transparent focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-[#1e293b] dark:text-white" placeholder="Your name" value={form.authorName} onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))} />
                                        <input className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-[#111418] focus:border-transparent focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-[#1e293b] dark:text-white" placeholder="Your email" type="email" value={form.authorEmail} onChange={(e) => setForm((p) => ({ ...p, authorEmail: e.target.value }))} />
                                    </div>
                                ) : <p className="mb-4 text-sm text-[#617589]">Dang binh luan voi tu cach <span className="font-semibold text-[#111418] dark:text-white">{user?.firstName} {user?.lastName}</span></p>}
                                <textarea className="w-full rounded-lg border border-[#e5e7eb] bg-white p-4 text-[16px] text-[#111418] focus:border-transparent focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-[#1e293b] dark:text-white" placeholder="Leave a comment..." rows={4} value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} />
                                <button onClick={() => void handleCommentSubmit()} disabled={submitting} className="mt-4 rounded-lg bg-primary px-6 py-2 font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">{submitting ? 'Sending...' : 'Post Comment'}</button>
                                <p className="mt-3 text-xs text-[#617589]">Binh luan moi se duoc dua vao hang cho duyet truoc khi hien cong khai.</p>
                            </div>

                            <div className="space-y-6">
                                {post.comments?.length ? post.comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-4">
                                        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">
                                            {comment.user ? getInitials(`${comment.user.firstName} ${comment.user.lastName}`) : getInitials(comment.authorName || 'Anonymous')}
                                        </div>
                                        <div className="flex-1">
                                            <div className="mb-1 flex items-center gap-2">
                                                <span className="font-bold text-[#111418] dark:text-white">{comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : comment.authorName || 'Anonymous'}</span>
                                                <span className="text-sm text-[#617589]">{formatDate(comment.createdAt)}</span>
                                            </div>
                                            <p className="text-[16px] leading-7 text-[#617589]">{comment.content}</p>
                                        </div>
                                    </div>
                                )) : <div className="rounded-xl bg-[#f9fafb] p-6 text-sm text-[#617589] dark:bg-surface-dark">Chua co binh luan nao. Hay de lai y kien dau tien cho bai viet nay.</div>}
                            </div>
                        </section>
                    </div>

                    <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
                        <div className="space-y-5">
                            <SidebarCard title="On this page">
                                {derivedTocItems.length ? (
                                    <ul ref={tocNavRef} className="max-h-[60vh] space-y-1.5 overflow-y-auto pr-1">
                                        {derivedTocItems.map((item) => (
                                            <li key={item.id}>
                                                <button
                                                    type="button"
                                                    data-toc-id={item.id}
                                                    onClick={() => scrollToHeading(item.id)}
                                                    className={`flex w-full items-start rounded-lg border-l-2 px-3 py-2 text-left transition-colors ${
                                                        effectiveActiveTocId === item.id
                                                            ? 'border-primary bg-primary/10 text-primary'
                                                            : 'border-transparent text-[#617589] hover:border-primary/40 hover:bg-primary/5 hover:text-primary'
                                                    } ${item.level === 3 ? 'ml-4 text-[13px]' : 'text-sm font-semibold'}`}
                                                >
                                                    {item.text}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-[#617589]">No headings found</p>
                                )}
                            </SidebarCard>

                            
                        </div>
                    </aside>
                </div>
            </section>

            <style jsx global>{`
                .article-copy { color: #4b5563; font-size: 16px; line-height: 1.95; }
                .dark .article-copy { color: #cbd5e1; }
                .article-copy h2, .article-copy h3 { position: relative; margin-top: 2rem; margin-bottom: 1rem; font-size: 22px; font-weight: 700; line-height: 1.5; color: #111827; scroll-margin-top: 8rem; }
                .dark .article-copy h2, .dark .article-copy h3 { color: #f8fafc; }
                .article-copy .heading-anchor-link { margin-left: 0.5rem; color: #137fec; opacity: 0; text-decoration: none; transition: opacity 0.18s ease; font-weight: 700; }
                .article-copy h2:hover .heading-anchor-link, .article-copy h3:hover .heading-anchor-link, .article-copy .heading-anchor-link:focus { opacity: 1; }
                .article-copy p, .article-copy li { margin-bottom: 1rem; font-size: 16px; line-height: 1.95; }
                .article-copy ul, .article-copy ol { margin: 1rem 0 1.5rem; padding-left: 1.5rem; }
                .article-copy strong { font-weight: 700; color: #111827; }
                .dark .article-copy strong { color: #f8fafc; }
                .article-copy em { font-style: italic; }
                .article-copy u { text-decoration: underline; text-underline-offset: 0.2em; }
                .article-copy a { color: #137fec; font-weight: 600; text-decoration: underline; text-underline-offset: 0.2em; }
                .article-copy blockquote { margin: 1.5rem 0; border-left: 3px solid #137fec; padding-left: 1rem; color: #475569; font-style: italic; }
                .dark .article-copy blockquote { color: #cbd5e1; }
                .article-copy code { background: #e2e8f0; color: #0f172a; border-radius: 0.375rem; padding: 0.15rem 0.4rem; font-family: 'JetBrains Mono', monospace; font-size: 0.92em; }
                .dark .article-copy code { background: #1e293b; color: #e2e8f0; }
            `}</style>
        </div>
    );
}
