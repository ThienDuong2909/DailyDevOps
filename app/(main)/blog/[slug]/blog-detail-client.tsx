'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { trackCommentSubmit } from '@/lib/analytics';
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

function buildAuthorUsername(firstName: string, lastName: string) {
    return `${firstName || ''} ${lastName || ''}`
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
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

function SidebarCard({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
    return (
        <div className="theme-surface rounded-2xl p-5">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[color:var(--text-main-theme)]">
                {icon ? <span className="material-symbols-outlined !text-[18px] text-primary">{icon}</span> : null}
                {title}
            </h3>
            {children}
        </div>
    );
}

function sortPostsNewestFirst(posts: Post[]) {
    return [...posts].sort(
        (left, right) =>
            new Date(right.publishedAt || right.createdAt).getTime() -
            new Date(left.publishedAt || left.createdAt).getTime()
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
            url: 'https://dailydevops.blog',
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
        url: `${siteUrl}/${post.slug}`,
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

function useScrollSpy({
    contentRef,
    derivedTocItems,
    setActiveTocId,
    scrollToHeading,
}: {
    contentRef: React.RefObject<HTMLDivElement | null>;
    derivedTocItems: TocItem[];
    setActiveTocId: React.Dispatch<React.SetStateAction<string>>;
    scrollToHeading: (headingId: string, options?: { updateHash?: boolean }) => void;
}) {
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
    }, [derivedTocItems, scrollToHeading, contentRef, setActiveTocId]);

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
}

function transformPostContent(primaryContent: string): string {
    if (!primaryContent) return '';
    return primaryContent
        .replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '')
        .replace(/<pre([^>]*)>\s*<code([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_m, preAttrs, codeAttrs, content) => {
            const extractAttributeValue = (source: string, attributeName: string) => {
                const normalizedSource = String(source || '');
                const marker = `${attributeName}=`;
                const attributeIndex = normalizedSource.toLowerCase().indexOf(marker);

                if (attributeIndex === -1) {
                    return '';
                }

                const valueStart = attributeIndex + marker.length;
                const quote = normalizedSource[valueStart];
                if (quote !== '"' && quote !== "'") {
                    return '';
                }

                const valueEnd = normalizedSource.indexOf(quote, valueStart + 1);
                if (valueEnd === -1) {
                    return '';
                }

                return normalizedSource.slice(valueStart + 1, valueEnd);
            };
            const matchRegex = (value: string, regex: RegExp) => regex.exec(value);

            const preLanguageMatch =
                matchRegex(String(preAttrs), /data-language=["']([^"']+)["']/i) ||
                matchRegex(String(preAttrs), /data-lang=["']([^"']+)["']/i);
            const codeClassValue = extractAttributeValue(String(codeAttrs), 'class');
            const codeLanguageFromClass = codeClassValue
                .split(/\s+/)
                .find((className) => className.startsWith('language-'))
                ?.slice('language-'.length);
            const codeLanguageMatch =
                matchRegex(String(codeAttrs), /data-language=["']([^"']+)["']/i) ||
                matchRegex(String(codeAttrs), /data-lang=["']([^"']+)["']/i);
            const language = (
                preLanguageMatch?.[1] ||
                codeLanguageMatch?.[1] ||
                codeLanguageFromClass ||
                'plaintext'
            ).toLowerCase();
            const withClass = codeAttrs.includes('class=')
                ? codeAttrs.replace(/class=["'](.*?)["']/, 'class="$1 !bg-transparent !p-0 !text-[#e2e8f0] !border-none !shadow-none"')
                : `${codeAttrs} class="!bg-transparent !p-0 !text-[#e2e8f0] !border-none !shadow-none"`;
            return `<div class="macos-mockup relative rounded-xl overflow-hidden bg-[#1e293b] my-8 shadow-xl border border-[#283039] font-mono group"><div class="flex items-center justify-between pl-4 pr-3 py-2 bg-[#0f172a] border-b border-[#283039]"><div class="flex gap-2"><div class="size-3 rounded-full bg-[#ff5f56]"></div><div class="size-3 rounded-full bg-[#ffbd2e]"></div><div class="size-3 rounded-full bg-[#27c93f]"></div></div><div class="flex items-center gap-3"><span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f84a1]">${language}</span><button class="copy-code-btn flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[#9dabb9] hover:text-white transition-colors text-[13px] font-semibold border border-white/5 opacity-0 group-hover:opacity-100 focus:opacity-100">Copy</button></div></div><div class="code-wrapper-scroll overflow-x-auto text-[13px] sm:text-sm leading-relaxed whitespace-pre font-mono text-[#e2e8f0]"><pre class="!bg-transparent !m-0 !p-5 !shadow-none !rounded-none !border-none"><code${withClass}>${content}</code></pre></div></div>`;
        });
}

function useReadingProgress() {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const onScroll = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(Math.min(100, max > 0 ? (window.scrollY / max) * 100 : 0));
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    return progress;
}

function useFetchPostData(slug: string) {
    const [post, setPost] = useState<PostWithComments | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
    const [popularPosts, setPopularPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

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
                setRelatedPosts(sortPostsNewestFirst(unwrap<Post[]>(relatedRes, [])));
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

    return { post, setPost, relatedPosts, popularPosts, loading, errorMessage };
}

function useCommentForm(post: PostWithComments | null, setPost: React.Dispatch<React.SetStateAction<PostWithComments | null>>, isAuthenticated: boolean) {
    const [form, setForm] = useState({ authorName: '', authorEmail: '', content: '' });
    const [submitting, setSubmitting] = useState(false);

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
            trackCommentSubmit(post.slug);
            toast.success('Comment da duoc gui va dang cho duyet');
        } catch {
            toast.error('Khong the gui comment luc nay');
        } finally {
            setSubmitting(false);
        }
    };

    return { form, setForm, submitting, handleCommentSubmit };
}

function usePostActions(postUrl: string, postTitle?: string, postExcerpt?: string) {
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

    const handleShare = async (mode: 'native' | 'copy') => {
        if (!postTitle) return;
        if (mode === 'native' && navigator.share) {
            try {
                await navigator.share({ title: postTitle, text: postExcerpt || postTitle, url: postUrl });
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

    return { handleContentClick, handleShare };
}

export default function BlogDetailClient() {
    const { slug } = useParams<{ slug: string }>();
    const { user, isAuthenticated, initializeAuth } = useAuthStore();
    const { post, setPost, relatedPosts, popularPosts, loading, errorMessage } = useFetchPostData(slug);
    const progress = useReadingProgress();
    const [activeTocId, setActiveTocId] = useState('');

    const contentRef = useRef<HTMLDivElement>(null);
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dailydevops.blog';
    const postUrl = `${siteUrl}/${slug}`;

    const { form, setForm, submitting, handleCommentSubmit } = useCommentForm(post, setPost, isAuthenticated);
    const { handleContentClick, handleShare } = usePostActions(postUrl, post?.title, post?.excerpt);

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

    const primaryContent = post?.contentHtml || post?.content || '';

    const transformedContent = useMemo(() => transformPostContent(primaryContent), [primaryContent]);

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

    useScrollSpy({ contentRef, derivedTocItems, setActiveTocId, scrollToHeading });

    if (loading) return <PostDetailSkeleton />;

    if (!post) {
        return (
            <div className="theme-shell flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <span className="material-symbols-outlined mb-4 !text-[56px] theme-soft">search_off</span>
                    <h1 className="mb-3 text-3xl font-bold text-[color:var(--text-main-theme)]">
                        {errorMessage || 'Post Not Found'}
                    </h1>
                    <p className="theme-muted mb-6 text-sm">The article you are looking for may have been removed or is temporarily unavailable.</p>
                    <Link
                        href="/blog"
                        className="inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                    >
                        Browse all articles
                    </Link>
                </div>
            </div>
        );
    }

    const authorName = `${post.author.firstName} ${post.author.lastName}`;

    return (
        <div className="min-h-screen" style={{ background: 'var(--surface-muted)', color: 'var(--text-main-theme)' }}>
            {/* JSON-LD Structured Data */}
            <BlogPostJsonLd post={post} postUrl={postUrl} />
            <BreadcrumbJsonLd post={post} siteUrl={siteUrl} />

            <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-transparent">
                <div className="h-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-150 ease-out" style={{ width: `${progress}%` }} />
            </div>

            <section className="mx-auto max-w-[1280px] overflow-x-clip px-4 pt-6 sm:pt-8 lg:px-8 lg:pt-10">
                <nav className="theme-muted mb-6 flex flex-wrap items-center gap-2 pb-1 text-sm">
                    <Link href="/" className="shrink-0 hover:text-primary">Blog</Link>
                    <span className="material-symbols-outlined shrink-0 text-sm">chevron_right</span>
                    {post.category ? <><span className="shrink-0">{post.category.name}</span><span className="material-symbols-outlined shrink-0 text-sm">chevron_right</span></> : null}
                    <span className="text-[color:var(--text-main-theme)] break-words">{post.title}</span>
                </nav>

                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
                    <div className="min-w-0">
                        <h1 className="mb-5 break-words text-[2rem] font-bold leading-[1.2] tracking-[-0.01em] text-[color:var(--text-main-theme)] sm:text-[30px]">{post.title}</h1>
                        <div className="mb-8 flex flex-wrap items-center gap-4 border-b pb-6" style={{ borderColor: 'var(--border-soft-theme)' }}>
                            <div
                                className="size-12 shrink-0 rounded-full bg-cover bg-center ring-2 ring-[color:var(--border-soft-theme)]"
                                style={{ backgroundImage: `url("${getImageUrl(post.author.avatar) || '/avatar-placeholder.jpg'}")` }}
                            />
                            <div className="min-w-0">
                                <Link
                                    href={`/author/${buildAuthorUsername(post.author.firstName, post.author.lastName)}`}
                                    className="block truncate font-semibold text-[color:var(--text-main-theme)] transition-colors hover:text-primary"
                                >
                                    {authorName}
                                </Link>
                                <p className="theme-muted mt-0.5 flex flex-wrap items-center gap-y-1 text-sm">
                                    {formatDate(post.publishedAt || post.createdAt)}
                                    <span className="mx-1.5 inline-block size-1 rounded-full align-middle" style={{ background: 'var(--text-soft-theme)' }} />
                                    {post.readingTime || 5} min read
                                    <span className="mx-1.5 inline-block size-1 rounded-full align-middle" style={{ background: 'var(--text-soft-theme)' }} />
                                    {post.viewCount || 0} views
                                </p>
                            </div>
                        </div>

                        <div className="mb-8 flex flex-wrap items-center gap-2.5">
                            {post.category ? (
                                <Link
                                    href={`/category/${post.category.slug}`}
                                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors hover:opacity-80"
                                    style={{ 
                                        backgroundColor: post.category.color ? `${post.category.color}1a` : 'color-mix(in srgb, var(--primary-theme) 12%, var(--surface-muted))',
                                        color: post.category.color || 'var(--primary-theme)'
                                    }}
                                >
                                    <span className="material-symbols-outlined !text-[14px]">folder</span>
                                    {post.category.name}
                                </Link>
                            ) : null}
                            {post.tags?.map((tag) => (
                                <Link
                                    key={tag.id}
                                    href={`/tag/${tag.slug}`}
                                    className="inline-flex rounded-full px-4 py-2 text-xs font-semibold text-[color:var(--text-main-theme)] transition-colors hover:text-primary"
                                    style={{ border: '1px solid var(--border-soft-theme)' }}
                                >
                                    #{tag.name}
                                </Link>
                            ))}
                        </div>

                        {post.featuredImage ? (
                            <div className="mb-10 overflow-hidden rounded-2xl" style={{ border: '1px solid var(--border-soft-theme)' }}>
                                <img
                                    src={getImageUrl(post.featuredImage)}
                                    alt={post.title}
                                    className="aspect-[21/9] w-full object-cover"
                                />
                            </div>
                        ) : null}

                        <div ref={contentRef} className="article-copy min-w-0 max-w-none overflow-x-hidden" onClick={handleContentClick} dangerouslySetInnerHTML={{ __html: formattedContent }} />

                        <section
                            className="relative mt-12 overflow-hidden rounded-[28px] px-6 py-8 sm:px-8"
                            style={{
                                background: 'var(--surface-base)',
                                border: '1px solid var(--border-soft-theme)',
                                boxShadow: 'var(--shadow-theme)',
                            }}
                        >
                            {/* Decorative glow */}
                            <div
                                className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full opacity-30 blur-3xl"
                                style={{ background: 'var(--primary-glow-theme)' }}
                            />
                            <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                <span className="material-symbols-outlined mr-1.5 !text-[16px] align-middle">mail</span>
                                Continue learning
                            </p>
                            <h2 className="relative mt-3 text-xl font-bold text-[color:var(--text-main-theme)] sm:text-2xl">
                                Get the next production-ready note in your inbox
                            </h2>
                            <p className="theme-muted relative mt-3 max-w-2xl text-sm leading-7">
                                Subscribe to DevOps Daily for practical writeups on Kubernetes, CI/CD,
                                observability, and operating real systems without the fluff.
                            </p>
                            <div className="relative mt-5 flex flex-wrap gap-3">
                                <Link
                                    href="/newsletter"
                                    className="theme-glow-button inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold transition-opacity hover:opacity-90"
                                >
                                    Join the newsletter
                                </Link>
                                <Link
                                    href="/blog"
                                    className="inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold text-[color:var(--text-main-theme)] transition-colors hover:text-primary"
                                    style={{ border: '1px solid var(--border-soft-theme)' }}
                                >
                                    Browse all articles
                                </Link>
                            </div>
                        </section>

                        <section className="mt-14">
                            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="flex items-center gap-2 text-[22px] font-bold text-[color:var(--text-main-theme)]">
                                        <span className="material-symbols-outlined !text-[22px] text-primary">forum</span>
                                        Discussion
                                    </h3>
                                    <p className="theme-muted mt-1 text-sm">
                                        {post.comments?.length || 0} approved comment{post.comments?.length === 1 ? '' : 's'} on this article.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        void handleShare(
                                            typeof navigator.share === 'function'
                                                ? 'native'
                                                : 'copy'
                                        )
                                    }
                                    className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-[color:var(--text-main-theme)] transition-colors hover:text-primary"
                                    style={{ border: '1px solid var(--border-soft-theme)' }}
                                >
                                    <span className="material-symbols-outlined !text-[18px]">share</span>
                                    Share
                                </button>
                            </div>
                            <div className="theme-surface mb-8 rounded-2xl p-6">
                                {!isAuthenticated ? (
                                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <input className="theme-input w-full rounded-2xl px-4 py-3 text-sm" placeholder="Your name" value={form.authorName} onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))} />
                                        <input className="theme-input w-full rounded-2xl px-4 py-3 text-sm" placeholder="Your email" type="email" value={form.authorEmail} onChange={(e) => setForm((p) => ({ ...p, authorEmail: e.target.value }))} />
                                    </div>
                                ) : (
                                    <div className="mb-4 flex items-center gap-2 text-sm">
                                        <span className="material-symbols-outlined !text-[18px] text-primary">account_circle</span>
                                        <span className="theme-muted">Commenting as</span>
                                        <span className="font-semibold text-[color:var(--text-main-theme)]">{user?.firstName} {user?.lastName}</span>
                                    </div>
                                )}
                                <textarea className="theme-input w-full rounded-2xl p-4 text-sm leading-relaxed" placeholder="Leave a comment..." rows={4} value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} />
                                <div className="mt-4 flex items-center justify-between">
                                    <button
                                        onClick={() => void handleCommentSubmit()}
                                        disabled={submitting}
                                        className="theme-glow-button inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined !text-[18px]">send</span>
                                        {submitting ? 'Sending...' : 'Post Comment'}
                                    </button>
                                    <p className="theme-muted hidden text-xs sm:block">Comments are moderated before publishing.</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {post.comments?.length ? post.comments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className="flex gap-4 rounded-2xl p-4 transition-colors"
                                        style={{ background: 'var(--surface-muted)' }}
                                    >
                                        <div
                                            className="flex size-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                                            style={{ background: 'var(--primary-glow-theme)' }}
                                        >
                                            {comment.user ? getInitials(`${comment.user.firstName} ${comment.user.lastName}`) : getInitials(comment.authorName || 'Anonymous')}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-bold text-[color:var(--text-main-theme)]">
                                                    {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : comment.authorName || 'Anonymous'}
                                                </span>
                                                <span className="theme-soft text-xs">{formatDate(comment.createdAt)}</span>
                                            </div>
                                            <p className="theme-muted text-sm leading-7">{comment.content}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex flex-col items-center rounded-2xl py-10" style={{ background: 'var(--surface-muted)' }}>
                                        <span className="material-symbols-outlined mb-3 !text-[36px] theme-soft">chat_bubble_outline</span>
                                        <p className="theme-muted text-sm">No comments yet. Be the first to share your thoughts.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
                        <div className="space-y-5">
                            <SidebarCard title="On this page" icon="toc">
                                {derivedTocItems.length ? (
                                    <ul ref={tocNavRef} className="custom-scrollbar max-h-[60vh] space-y-1 overflow-y-auto pr-1">
                                        {derivedTocItems.map((item) => (
                                            <li key={item.id}>
                                                <button
                                                    type="button"
                                                    data-toc-id={item.id}
                                                    onClick={() => scrollToHeading(item.id)}
                                                    className={`flex w-full items-start rounded-lg border-l-2 px-3 py-2 text-left transition-all duration-200 ${
                                                        effectiveActiveTocId === item.id
                                                            ? 'border-primary text-primary font-semibold'
                                                            : 'border-transparent theme-muted hover:border-primary/40 hover:text-primary'
                                                    } ${item.level === 3 ? 'ml-4 text-[13px]' : 'text-sm'}`}
                                                    style={effectiveActiveTocId === item.id ? { background: 'color-mix(in srgb, var(--primary-theme) 8%, transparent)' } : undefined}
                                                >
                                                    {item.text}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="theme-muted text-sm">No headings found</p>
                                )}
                            </SidebarCard>
                            <SidebarCard title="Article snapshot" icon="info">
                                <div className="space-y-3 text-sm">
                                    {[
                                        { label: 'Published', value: formatDate(post.publishedAt || post.createdAt), icon: 'calendar_month' },
                                        { label: 'Reading time', value: `${post.readingTime || 5} min`, icon: 'schedule' },
                                        { label: 'Views', value: String(post.viewCount || 0), icon: 'visibility' },
                                    ].map((row) => (
                                        <div key={row.label} className="flex items-center justify-between gap-4">
                                            <span className="theme-muted flex items-center gap-1.5">
                                                <span className="material-symbols-outlined !text-[16px] theme-soft">{row.icon}</span>
                                                {row.label}
                                            </span>
                                            <span className="font-semibold text-[color:var(--text-main-theme)]">
                                                {row.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </SidebarCard>

                            <SidebarCard title="Share and explore" icon="explore">
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {post.tags?.map((tag) => (
                                            <Link
                                                key={`sidebar-${tag.id}`}
                                                href={`/tag/${tag.slug}`}
                                                className="rounded-full px-3 py-1.5 text-xs font-semibold text-[color:var(--text-main-theme)] transition-colors hover:text-primary"
                                                style={{ border: '1px solid var(--border-soft-theme)' }}
                                            >
                                                #{tag.name}
                                            </Link>
                                        ))}
                                    </div>
                                    <div className="grid gap-2">
                                        <button
                                            type="button"
                                            onClick={() => void handleShare('copy')}
                                            className="theme-glow-button inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-opacity hover:opacity-90"
                                        >
                                            <span className="material-symbols-outlined !text-[18px]">link</span>
                                            Copy article link
                                        </button>
                                        {post.category ? (
                                            <Link
                                                href={`/category/${post.category.slug}`}
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-[color:var(--text-main-theme)] transition-colors hover:text-primary"
                                                style={{ border: '1px solid var(--border-soft-theme)' }}
                                            >
                                                <span className="material-symbols-outlined !text-[18px]">category</span>
                                                More in {post.category.name}
                                            </Link>
                                        ) : null}
                                    </div>
                                </div>
                            </SidebarCard>

                            <SidebarCard title="Continue reading" icon="auto_stories">
                                {relatedPosts.length ? (
                                    <div className="space-y-1">
                                        {relatedPosts.map((item) => (
                                            <Link
                                                key={item.id}
                                                href={`/${item.slug}`}
                                                className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:text-primary"
                                                style={{ '--hover-bg': 'color-mix(in srgb, var(--primary-theme) 6%, transparent)' } as React.CSSProperties}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = 'color-mix(in srgb, var(--primary-theme) 6%, transparent)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                {item.featuredImage ? (
                                                    <img
                                                        src={getImageUrl(item.featuredImage)}
                                                        alt=""
                                                        className="size-10 shrink-0 rounded-lg object-cover"
                                                        style={{ border: '1px solid var(--border-ghost-theme)' }}
                                                    />
                                                ) : (
                                                    <div
                                                        className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                                                        style={{ background: 'var(--surface-muted)', border: '1px solid var(--border-ghost-theme)' }}
                                                    >
                                                        <span className="material-symbols-outlined !text-[16px] theme-soft">article</span>
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="line-clamp-2 text-sm font-semibold text-[color:var(--text-main-theme)]">
                                                        {item.title}
                                                    </p>
                                                    <p className="theme-soft mt-0.5 text-xs">
                                                        {item.readingTime || 5} min read
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="theme-muted text-sm">
                                        More articles in this topic will appear here as related content grows.
                                    </p>
                                )}
                            </SidebarCard>

                            <SidebarCard title="Popular now" icon="trending_up">
                                {popularPosts.length ? (
                                    <div className="space-y-1">
                                        {popularPosts.map((item, index) => (
                                            <Link
                                                key={`popular-${item.id}`}
                                                href={`/${item.slug}`}
                                                className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:text-primary"
                                                onMouseEnter={(e) => (e.currentTarget.style.background = 'color-mix(in srgb, var(--primary-theme) 6%, transparent)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <span
                                                    className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-primary"
                                                    style={{ background: 'color-mix(in srgb, var(--primary-theme) 10%, var(--surface-muted))' }}
                                                >
                                                    {index + 1}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="line-clamp-2 text-sm font-semibold text-[color:var(--text-main-theme)]">
                                                        {item.title}
                                                    </p>
                                                    <p className="theme-soft mt-0.5 text-xs">
                                                        {item.viewCount || 0} views
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="theme-muted text-sm">Popular posts are loading from the public feed.</p>
                                )}
                            </SidebarCard>
                        </div>
                    </aside>
                </div>
            </section>

            <style jsx global>{`
                .article-copy { color: var(--text-muted-theme); font-size: 16px; line-height: 1.95; max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
                .article-copy > * { max-width: 100%; }
                .article-copy h2, .article-copy h3 { position: relative; margin-top: 2rem; margin-bottom: 1rem; font-size: 22px; font-weight: 700; line-height: 1.5; color: var(--text-main-theme); scroll-margin-top: 8rem; overflow-wrap: anywhere; }
                .article-copy .heading-anchor-link { margin-left: 0.5rem; color: #137fec; opacity: 0; text-decoration: none; transition: opacity 0.18s ease; font-weight: 700; }
                .article-copy h2:hover .heading-anchor-link, .article-copy h3:hover .heading-anchor-link, .article-copy .heading-anchor-link:focus { opacity: 1; }
                .article-copy p, .article-copy li { margin-bottom: 1rem; font-size: 16px; line-height: 1.95; overflow-wrap: anywhere; word-break: break-word; }
                .article-copy ul, .article-copy ol { margin: 1rem 0 1.5rem; padding-left: 1.5rem; }
                .article-copy strong { font-weight: 700; color: var(--text-main-theme); }
                .article-copy em { font-style: italic; }
                .article-copy u { text-decoration: underline; text-underline-offset: 0.2em; }
                .article-copy a { color: #137fec; font-weight: 600; text-decoration: underline; text-underline-offset: 0.2em; }
                .article-copy blockquote { margin: 1.5rem 0; border-left: 3px solid #137fec; padding-left: 1rem; color: var(--text-muted-theme); font-style: italic; }
                .article-copy code { background: color-mix(in srgb, var(--primary-theme) 10%, var(--surface-muted)); color: var(--text-main-theme); border-radius: 0.375rem; padding: 0.15rem 0.4rem; font-family: 'JetBrains Mono', monospace; font-size: 0.92em; }
                .article-copy pre { margin: 1.75rem 0; max-width: 100%; overflow-x: auto; border-radius: 1rem; background: color-mix(in srgb, var(--surface-strong) 88%, black 12%); border: 1px solid var(--border-soft-theme); color: #e6eef8; }
                .article-copy pre code { display: block; background: transparent; color: inherit; border-radius: 0; padding: 1.1rem 1.25rem; white-space: pre; }
                .article-copy img, .article-copy video, .article-copy canvas, .article-copy svg, .article-copy iframe { display: block; max-width: 100%; height: auto; }
                .article-copy img { border-radius: 1rem; border: 1px solid var(--border-soft-theme); margin: 1.5rem auto; }
                .article-copy img[data-align="left"] { margin-left: 0; margin-right: auto; }
                .article-copy img[data-align="right"] { margin-left: auto; margin-right: 0; }
                .article-copy img[data-align="center"] { margin-left: auto; margin-right: auto; }
                .article-copy .macos-mockup, .article-copy .code-wrapper-scroll, .article-copy table, .article-copy figure, .article-copy .resizable-image-node { max-width: 100%; }
                .article-copy table { display: block; width: 100%; margin: 1.75rem 0; border-collapse: collapse; overflow-x: auto; overflow-y: hidden; border: 1px solid var(--border-soft-theme); border-radius: 1rem; table-layout: fixed; -webkit-overflow-scrolling: touch; }
                .article-copy th, .article-copy td { border-bottom: 1px solid var(--border-ghost-theme); padding: 0.9rem 1rem; vertical-align: top; }
                .article-copy th { background: var(--surface-muted); color: var(--text-muted-theme); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; }
                .article-copy td { color: var(--text-main-theme); }
                .article-copy td p:last-child, .article-copy th p:last-child { margin-bottom: 0; }
                @media (max-width: 640px) {
                    .article-copy { font-size: 15px; line-height: 1.85; }
                    .article-copy h2, .article-copy h3 { font-size: 1.75rem; line-height: 1.3; }
                    .article-copy pre code { padding: 0.95rem 1rem; font-size: 12px; }
                    .article-copy table { font-size: 14px; }
                    .article-copy th, .article-copy td { padding: 0.75rem; }
                    .article-copy .heading-anchor-link { display: none; }
                }
            `}</style>
        </div>
    );
}
