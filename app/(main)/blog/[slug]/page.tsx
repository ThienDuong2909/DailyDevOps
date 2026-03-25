'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

function unwrap<T>(payload: unknown, fallback: T): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return ((payload as { data?: T }).data ?? fallback) as T;
    }
    return (payload as T) ?? fallback;
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-5 dark:border-gray-800 dark:bg-surface-dark">
            <h3 className="mb-4 text-base font-bold text-[#111418] dark:text-white">{title}</h3>
            {children}
        </div>
    );
}

export default function BlogDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const { user, isAuthenticated, initializeAuth } = useAuthStore();
    const [post, setPost] = useState<PostWithComments | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
    const [popularPosts, setPopularPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [progress, setProgress] = useState(0);
    const [tocItems, setTocItems] = useState<TocItem[]>([]);
    const [activeTocId, setActiveTocId] = useState('');
    const [form, setForm] = useState({ authorName: '', authorEmail: '', content: '' });
    const contentRef = useRef<HTMLDivElement>(null);
    const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/blog/${slug}` : `http://localhost:3000/blog/${slug}`;

    useEffect(() => {
        void initializeAuth();
    }, [initializeAuth]);

    useEffect(() => {
        const onScroll = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(Math.min(100, max > 0 ? (window.scrollY / max) * 100 : 0));
            if (!contentRef.current) return;
            let current = '';
            contentRef.current.querySelectorAll('h2, h3').forEach((node) => {
                if ((node as HTMLElement).getBoundingClientRect().top <= 140) current = node.id;
            });
            if (current) setActiveTocId(current);
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

    useEffect(() => {
        if (!contentRef.current) return;
        const items: TocItem[] = [];
        contentRef.current.querySelectorAll('h2, h3').forEach((node, index) => {
            const id = node.id || `heading-${index}`;
            node.id = id;
            items.push({ id, text: node.textContent || '', level: node.tagName === 'H2' ? 2 : 3 });
        });
        setTocItems(items);
    }, [post]);

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

    const formattedContent = post?.content
        ? post.content.replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/gi, (_m, attrs, content) => {
              const withClass = attrs.includes('class=')
                  ? attrs.replace(/class=["'](.*?)["']/, 'class="$1 !bg-transparent !p-0 !text-[#e2e8f0] !border-none !shadow-none"')
                  : `${attrs} class="!bg-transparent !p-0 !text-[#e2e8f0] !border-none !shadow-none"`;
              return `<div class="macos-mockup relative rounded-xl overflow-hidden bg-[#1e293b] my-8 shadow-xl border border-[#283039] font-mono group"><div class="flex items-center justify-between pl-4 pr-3 py-2 bg-[#0f172a] border-b border-[#283039]"><div class="flex gap-2"><div class="size-3 rounded-full bg-[#ff5f56]"></div><div class="size-3 rounded-full bg-[#ffbd2e]"></div><div class="size-3 rounded-full bg-[#27c93f]"></div></div><button class="copy-code-btn flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[#9dabb9] hover:text-white transition-colors text-[13px] font-semibold border border-white/5 opacity-0 group-hover:opacity-100 focus:opacity-100">Copy</button></div><div class="code-wrapper-scroll overflow-x-auto text-[13px] sm:text-sm leading-relaxed whitespace-pre font-mono text-[#e2e8f0]"><pre class="!bg-transparent !m-0 !p-5 !shadow-none !rounded-none !border-none"><code${withClass}>${content}</code></pre></div></div>`;
          })
        : '';

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

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
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

                    <aside className="min-w-0">
                        <div className="sticky top-24 space-y-5">
                            <SidebarCard title="On this page">
                                {tocItems.length ? <ul className="space-y-3 text-sm">{tocItems.map((item) => <li key={item.id} style={{ paddingLeft: item.level === 3 ? '0.75rem' : '0' }}><button type="button" onClick={() => { const h = document.getElementById(item.id); if (h) { h.scrollIntoView({ behavior: 'smooth', block: 'start' }); setActiveTocId(item.id); } }} className={`text-left transition-colors hover:text-primary ${activeTocId === item.id ? 'font-medium text-primary' : 'text-[#617589]'}`}>{item.text}</button></li>)}</ul> : <p className="text-sm text-[#617589]">No headings found</p>}
                            </SidebarCard>
                            <SidebarCard title="Related tags">
                                {post.tags?.length ? <div className="flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag.id} className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-500">#{tag.name}</span>)}</div> : <p className="text-sm text-[#617589]">Chua co tag nao duoc gan.</p>}
                            </SidebarCard>
                            <SidebarCard title="Most viewed">
                                {popularPosts.length ? <div className="space-y-4">{popularPosts.map((item, index) => <Link key={item.id} href={`/blog/${item.slug}`} className="block rounded-lg border border-transparent p-3 transition-colors hover:border-border-dark hover:bg-white/5"><div className="mb-2 flex items-center gap-2 text-xs text-[#617589]"><span className="font-mono text-primary">0{index + 1}</span><span>{item.viewCount || 0} views</span></div><h4 className="text-sm font-semibold leading-6 text-[#111418] dark:text-white">{item.title}</h4></Link>)}</div> : <p className="text-sm text-[#617589]">Chua co du lieu bai viet pho bien.</p>}
                            </SidebarCard>
                            <SidebarCard title="Share">
                                <div className="flex gap-3">
                                    <button onClick={() => void handleShare('native')} className="flex size-10 items-center justify-center rounded-lg bg-[#1DA1F2]/10 text-[#1DA1F2] transition-colors hover:bg-[#1DA1F2] hover:text-white"><span className="material-symbols-outlined text-lg">share</span></button>
                                    <button onClick={() => void handleShare('copy')} className="flex size-10 items-center justify-center rounded-lg bg-[#0077B5]/10 text-[#0077B5] transition-colors hover:bg-[#0077B5] hover:text-white"><span className="material-symbols-outlined text-lg">link</span></button>
                                </div>
                                <p className="mt-3 break-all text-xs text-[#617589]">{postUrl}</p>
                            </SidebarCard>
                            <SidebarCard title="Related posts">
                                {relatedPosts.length ? <div className="space-y-4">{relatedPosts.map((item) => <Link key={item.id} href={`/blog/${item.slug}`} className="block rounded-lg border border-transparent p-3 transition-colors hover:border-border-dark hover:bg-white/5"><p className="mb-1 text-xs text-[#617589]">{item.category?.name || 'General'}</p><h4 className="text-sm font-semibold leading-6 text-[#111418] dark:text-white">{item.title}</h4></Link>)}</div> : <p className="text-sm text-[#617589]">Chua co bai viet lien quan du de hien thi.</p>}
                            </SidebarCard>
                        </div>
                    </aside>
                </div>
            </section>

            <style jsx global>{`
                .article-copy { color: #4b5563; font-size: 16px; line-height: 1.95; }
                .dark .article-copy { color: #cbd5e1; }
                .article-copy h2, .article-copy h3 { margin-top: 2rem; margin-bottom: 1rem; font-size: 22px; font-weight: 700; line-height: 1.5; color: #111827; }
                .dark .article-copy h2, .dark .article-copy h3 { color: #f8fafc; }
                .article-copy p, .article-copy li { margin-bottom: 1rem; font-size: 16px; line-height: 1.95; }
                .article-copy ul, .article-copy ol { margin: 1rem 0 1.5rem; padding-left: 1.5rem; }
                .article-copy strong { font-weight: 700; color: #111827; }
                .dark .article-copy strong { color: #f8fafc; }
                .article-copy code { background: #e2e8f0; color: #0f172a; border-radius: 0.375rem; padding: 0.15rem 0.4rem; font-family: 'JetBrains Mono', monospace; font-size: 0.92em; }
                .dark .article-copy code { background: #1e293b; color: #e2e8f0; }
            `}</style>
        </div>
    );
}
