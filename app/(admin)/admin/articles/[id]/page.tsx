'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import type { Category, Post, PostStatus, Tag } from '@/types';
import { formatDate, formatRelativeTime, getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

type PostPayload = { data?: Post } | Post;
type TaxonomyPayload<T> = { data?: T[] } | T[];

interface ArticleFormState {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featuredImage: string;
    status: PostStatus;
    categoryId: string;
    tagIds: string[];
    scheduledAt: string;
}

const initialFormState: ArticleFormState = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    status: 'DRAFT',
    categoryId: '',
    tagIds: [],
    scheduledAt: '',
};

function resolveData<T>(payload: T | { data?: T }, fallback: T): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return (payload.data ?? fallback) as T;
    }

    return (payload as T) ?? fallback;
}

function createSlug(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
}

function buildFormState(post?: Post): ArticleFormState {
    if (!post) {
        return initialFormState;
    }

    return {
        title: post.title || '',
        slug: post.slug || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        featuredImage: post.featuredImage || '',
        status: post.status || 'DRAFT',
        categoryId: post.category?.id || '',
        tagIds: post.tags?.map((tag) => tag.id) || [],
        scheduledAt: post.scheduledAt ? post.scheduledAt.slice(0, 16) : '',
    };
}

function countWords(content: string) {
    const plainText = content.replace(/<[^>]+>/g, ' ').trim();

    if (!plainText) {
        return 0;
    }

    return plainText.split(/\s+/).length;
}

export default function ArticleEditPage() {
    const params = useParams();
    const router = useRouter();
    const articleId = params.id as string;
    const isNewArticle = articleId === 'new';

    const [article, setArticle] = useState<Post | null>(null);
    const [formState, setFormState] = useState<ArticleFormState>(initialFormState);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const fetchTaxonomies = useCallback(async () => {
        const [categoriesPayload, tagsPayload] = await Promise.all([
            apiClient.get<TaxonomyPayload<Category>>('/api/v1/categories'),
            apiClient.get<TaxonomyPayload<Tag>>('/api/v1/tags'),
        ]);

        setCategories(resolveData<Category[]>(categoriesPayload, []));
        setTags(resolveData<Tag[]>(tagsPayload, []));
    }, []);

    const fetchArticle = useCallback(async () => {
        if (isNewArticle) {
            setArticle(null);
            setFormState(initialFormState);
            return;
        }

        const payload = await apiClient.get<PostPayload>(`/api/v1/posts/${articleId}`);
        const resolved = resolveData<Post | null>(payload, null);

        setArticle(resolved);
        setFormState(buildFormState(resolved || undefined));
    }, [articleId, isNewArticle]);

    useEffect(() => {
        let isMounted = true;

        const loadPage = async () => {
            try {
                setLoading(true);
                setErrorMessage('');

                await Promise.all([fetchTaxonomies(), fetchArticle()]);

                if (!isMounted) {
                    return;
                }
            } catch {
                if (!isMounted) {
                    return;
                }

                setErrorMessage('Khong the tai du lieu bai viet de chinh sua.');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void loadPage();

        return () => {
            isMounted = false;
        };
    }, [fetchArticle, fetchTaxonomies]);

    const stats = useMemo(() => {
        const words = countWords(formState.content);

        return {
            words,
            characters: formState.content.length,
            readingTime: Math.max(1, Math.ceil(words / 200)),
        };
    }, [formState.content]);

    const lastSavedLabel = article?.updatedAt ? formatRelativeTime(article.updatedAt) : 'Chua luu lan nao';

    const handleFieldChange = <K extends keyof ArticleFormState>(
        field: K,
        value: ArticleFormState[K]
    ) => {
        setFormState((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const handleTagToggle = (tagId: string) => {
        setFormState((previous) => ({
            ...previous,
            tagIds: previous.tagIds.includes(tagId)
                ? previous.tagIds.filter((item) => item !== tagId)
                : [...previous.tagIds, tagId],
        }));
    };

    const handleGenerateSlug = () => {
        handleFieldChange('slug', createSlug(formState.title));
    };

    const handleSave = async () => {
        if (!formState.title.trim() || !formState.content.trim()) {
            toast.error('Title va content la bat buoc');
            return;
        }

        setIsSaving(true);

        const payload = {
            title: formState.title.trim(),
            slug: formState.slug.trim() || createSlug(formState.title),
            excerpt: formState.excerpt.trim() || null,
            content: formState.content,
            featuredImage: formState.featuredImage.trim() || null,
            status: formState.status,
            categoryId: formState.categoryId || null,
            tagIds: formState.tagIds,
            scheduledAt:
                formState.status === 'SCHEDULED' && formState.scheduledAt
                    ? new Date(formState.scheduledAt).toISOString()
                    : null,
        };

        try {
            if (isNewArticle) {
                const response = await apiClient.post<PostPayload>('/api/v1/posts', payload);
                const createdPost = resolveData<Post | null>(response, null);

                toast.success('Da tao bai viet moi');

                if (createdPost?.id) {
                    router.replace(`/admin/articles/${createdPost.id}`);
                }

                return;
            }

            const response = await apiClient.put<PostPayload>(`/api/v1/posts/${articleId}`, payload);
            const updatedPost = resolveData<Post | null>(response, null);

            setArticle(updatedPost);
            setFormState(buildFormState(updatedPost || undefined));
            toast.success('Da luu thay doi bai viet');
        } catch {
            toast.error('Khong the luu bai viet luc nay');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (isNewArticle) {
            router.push('/admin/articles');
            return;
        }

        if (!confirm('Ban co chac muon xoa bai viet nay khong?')) {
            return;
        }

        try {
            setIsDeleting(true);
            await apiClient.delete(`/api/v1/posts/${articleId}`);
            toast.success('Da xoa bai viet');
            router.push('/admin/articles');
        } catch {
            toast.error('Khong the xoa bai viet');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="rounded-xl border border-border-dark bg-[#1e293b] p-8 text-sm text-[#9dabb9]">
                Dang tai du lieu bai viet...
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="rounded-xl border border-border-dark bg-[#1e293b] p-8 text-center">
                <span className="material-symbols-outlined mb-3 block text-4xl text-[#fa6238]">warning</span>
                <p className="text-sm text-[#9dabb9]">{errorMessage}</p>
                <Link
                    href="/admin/articles"
                    className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-bold text-white"
                >
                    Quay lai danh sach
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <header className="-mx-6 -mt-6 mb-2 flex h-16 shrink-0 items-center justify-between border-b border-border-dark bg-[#111418] px-6 lg:-mx-8 lg:-mt-8 lg:mb-4 lg:px-10">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/articles"
                        className="flex size-8 items-center justify-center rounded-full text-[#9dabb9] transition-colors hover:bg-[#283039] hover:text-white"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div className="mx-1 h-6 w-px bg-border-dark" />
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-white">
                            {isNewArticle ? 'Bai viet moi' : 'Chinh sua bai viet'}
                        </h2>
                        <p className="text-xs text-[#9dabb9]">
                            Last saved: <span className="text-white">{lastSavedLabel}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!isNewArticle && formState.slug ? (
                        <Link
                            href={`/blog/${formState.slug}`}
                            target="_blank"
                            className="hidden h-9 items-center gap-2 rounded-lg border border-border-dark bg-[#283039] px-4 text-sm font-bold text-[#9dabb9] transition-colors hover:bg-[#3b4754] hover:text-white sm:inline-flex"
                        >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                            Preview
                        </Link>
                    ) : null}
                    <button
                        onClick={() => void handleSave()}
                        disabled={isSaving}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {isSaving ? 'sync' : 'save'}
                        </span>
                        {isSaving ? 'Dang luu...' : 'Luu bai viet'}
                    </button>
                </div>
            </header>

            <div className="grid max-w-[1600px] grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="flex flex-col gap-6 lg:col-span-8">
                    <div className="flex flex-col gap-3">
                        <input
                            type="text"
                            value={formState.title}
                            onChange={(event) => handleFieldChange('title', event.target.value)}
                            placeholder="Nhap tieu de bai viet..."
                            className="w-full border-0 border-b border-border-dark bg-transparent px-0 py-2 text-3xl font-bold text-white placeholder-[#586069] transition-colors focus:border-primary focus:ring-0"
                        />
                        <div className="flex items-center gap-2 text-sm">
                            <span className="select-none text-[#9dabb9]">https://devops-blog.com/blog/</span>
                            <div className="group relative flex-1">
                                <input
                                    type="text"
                                    value={formState.slug}
                                    onChange={(event) => handleFieldChange('slug', event.target.value)}
                                    className="w-full rounded border border-border-dark bg-[#111418] px-2 py-1 text-xs font-mono text-[#9dabb9] transition-all focus:border-primary focus:text-white focus:ring-1 focus:ring-primary"
                                />
                                <button
                                    onClick={handleGenerateSlug}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9dabb9] opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                                    title="Tao lai slug tu title"
                                >
                                    <span className="material-symbols-outlined text-[16px]">autorenew</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border-dark bg-surface-dark p-5">
                        <label className="mb-2 block text-xs font-medium uppercase text-[#9dabb9]">Excerpt</label>
                        <textarea
                            value={formState.excerpt}
                            onChange={(event) => handleFieldChange('excerpt', event.target.value)}
                            rows={3}
                            className="w-full resize-none rounded-lg border border-border-dark bg-[#111418] px-4 py-3 text-sm text-white placeholder-[#586069] focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="Tom tat ngan de hien thi tren danh sach bai viet..."
                        />
                    </div>

                    <div className="flex min-h-[600px] flex-col overflow-hidden rounded-xl border border-border-dark bg-surface-dark shadow-sm">
                        <div className="border-b border-border-dark bg-[#111418] px-4 py-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-white">Noi dung bai viet</h3>
                                    <p className="mt-1 text-xs text-[#9dabb9]">
                                        Dang su dung editor don gian de viet HTML/Markdown phu hop backend hien tai.
                                    </p>
                                </div>
                                <span className="rounded-full border border-border-dark px-2.5 py-1 font-mono text-[11px] text-[#9dabb9]">
                                    HTML / Markdown
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 p-6">
                            <textarea
                                value={formState.content}
                                onChange={(event) => handleFieldChange('content', event.target.value)}
                                className="custom-scrollbar min-h-[440px] w-full resize-none rounded-lg border border-border-dark bg-[#111418] p-4 font-mono text-sm leading-7 text-white placeholder-[#586069] focus:border-primary focus:ring-1 focus:ring-primary"
                                placeholder="Viet noi dung bai viet tai day..."
                            />
                        </div>
                        <div className="flex items-center justify-between border-t border-border-dark bg-[#111418] px-4 py-2 text-xs text-[#9dabb9]">
                            <span>Words: {stats.words}</span>
                            <div className="flex gap-4">
                                <span>Characters: {stats.characters}</span>
                                <span>Reading time: {stats.readingTime} min</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6 lg:col-span-4">
                    <div className="rounded-xl border border-border-dark bg-surface-dark p-5 shadow-sm">
                        <h3 className="mb-4 text-sm font-bold text-white">Publishing</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-[#9dabb9]">Status</label>
                                <select
                                    value={formState.status}
                                    onChange={(event) => handleFieldChange('status', event.target.value as PostStatus)}
                                    className="w-full cursor-pointer rounded-lg border border-border-dark bg-[#111418] px-3 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary"
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="PUBLISHED">Published</option>
                                    <option value="SCHEDULED">Scheduled</option>
                                    <option value="ARCHIVED">Archived</option>
                                </select>
                            </div>

                            {formState.status === 'SCHEDULED' ? (
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-[#9dabb9]">Scheduled time</label>
                                    <input
                                        type="datetime-local"
                                        value={formState.scheduledAt}
                                        onChange={(event) => handleFieldChange('scheduledAt', event.target.value)}
                                        className="w-full rounded-lg border border-border-dark bg-[#111418] px-3 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary [color-scheme:dark]"
                                    />
                                </div>
                            ) : null}

                            <div className="rounded-lg border border-border-dark bg-[#111418] px-4 py-3 text-xs text-[#9dabb9]">
                                {article?.publishedAt ? (
                                    <span>Published at {formatDate(article.publishedAt)}</span>
                                ) : (
                                    <span>Chua duoc publish.</span>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-border-dark pt-4">
                            <button
                                onClick={() => void handleDelete()}
                                disabled={isDeleting}
                                className="text-sm font-medium text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
                            >
                                {isDeleting ? 'Dang xoa...' : 'Move to Trash'}
                            </button>
                            {!isNewArticle ? (
                                <span className="text-xs italic text-[#9dabb9]">
                                    {article?.createdAt ? `Created ${formatDate(article.createdAt)}` : ''}
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <div className="rounded-xl border border-border-dark bg-surface-dark p-5 shadow-sm">
                        <h3 className="mb-4 text-sm font-bold text-white">Author</h3>
                        <div className="rounded-lg border border-border-dark bg-[#111418] p-3">
                            {article?.author ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-primary/15">
                                        {article.author.avatar ? (
                                            <img
                                                src={getImageUrl(article.author.avatar)}
                                                alt={`${article.author.firstName} ${article.author.lastName}`}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="material-symbols-outlined text-primary">person</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white">
                                            {article.author.firstName} {article.author.lastName}
                                        </span>
                                        <span className="text-[10px] text-[#9dabb9]">Tac gia hien tai</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-[#9dabb9]">
                                    Bai viet moi se gan tac gia theo tai khoan dang dang nhap.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-border-dark bg-surface-dark p-5 shadow-sm">
                        <h3 className="mb-4 text-sm font-bold text-white">Taxonomy</h3>
                        <div className="mb-5">
                            <label className="mb-1.5 block text-xs font-medium text-[#9dabb9]">Category</label>
                            <select
                                value={formState.categoryId}
                                onChange={(event) => handleFieldChange('categoryId', event.target.value)}
                                className="w-full cursor-pointer rounded-lg border border-border-dark bg-[#111418] px-3 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary"
                            >
                                <option value="">Khong chon category</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-xs font-medium text-[#9dabb9]">Tags</label>
                                <span className="text-[10px] uppercase tracking-wide text-[#9dabb9]">
                                    {formState.tagIds.length} selected
                                </span>
                            </div>
                            <div className="custom-scrollbar max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border-dark bg-[#111418] p-3">
                                {tags.length === 0 ? (
                                    <p className="text-sm text-[#9dabb9]">Chua co tag nao de gan cho bai viet.</p>
                                ) : (
                                    tags.map((tag) => (
                                        <label key={tag.id} className="flex cursor-pointer items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formState.tagIds.includes(tag.id)}
                                                onChange={() => handleTagToggle(tag.id)}
                                                className="rounded border-border-dark bg-[#283039] text-primary focus:ring-0 focus:ring-offset-0"
                                            />
                                            <span className="text-sm text-white">{tag.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border-dark bg-surface-dark p-5 shadow-sm">
                        <h3 className="mb-4 text-sm font-bold text-white">Featured Image</h3>
                        <input
                            type="url"
                            value={formState.featuredImage}
                            onChange={(event) => handleFieldChange('featuredImage', event.target.value)}
                            placeholder="https://..."
                            className="w-full rounded-lg border border-border-dark bg-[#111418] px-3 py-2 text-sm text-white placeholder-[#586069] focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <div className="relative mt-4 aspect-video overflow-hidden rounded-lg border border-dashed border-[#283039] bg-[#111418]">
                            {formState.featuredImage ? (
                                <img
                                    src={getImageUrl(formState.featuredImage)}
                                    alt="Featured preview"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-[#9dabb9]">
                                    Chua co anh dai dien
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #111418;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #3b4754;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
}
