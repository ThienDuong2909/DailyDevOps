'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { PaginatedResponse, Post } from '@/types';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

type PostsPayload = PaginatedResponse<Post> | { data?: PaginatedResponse<Post> | Post[] } | Post[];

function resolvePostsPayload(payload: PostsPayload) {
    if (Array.isArray(payload)) {
        return {
            data: payload,
            meta: {
                total: payload.length,
                page: 1,
                limit: payload.length || 10,
                totalPages: 1,
            },
        };
    }

    if (payload && typeof payload === 'object' && 'data' in payload) {
        const nestedData = payload.data;

        if (Array.isArray(nestedData)) {
            return {
                data: nestedData,
                meta: {
                    total: nestedData.length,
                    page: 1,
                    limit: nestedData.length || 10,
                    totalPages: 1,
                },
            };
        }

        if (nestedData && typeof nestedData === 'object' && 'meta' in nestedData) {
            return nestedData as PaginatedResponse<Post>;
        }
    }

    return payload as PaginatedResponse<Post>;
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'PUBLISHED':
            return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', dot: 'bg-green-400', label: 'Published' };
        case 'DRAFT':
            return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', dot: 'bg-yellow-400', label: 'Draft' };
        case 'ARCHIVED':
            return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', dot: 'bg-gray-400', label: 'Archived' };
        case 'SCHEDULED':
            return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', dot: 'bg-cyan-400', label: 'Scheduled' };
        default:
            return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', dot: 'bg-gray-400', label: status };
    }
}

function getAuthorInitials(post: Post) {
    return `${post.author?.firstName?.[0] || ''}${post.author?.lastName?.[0] || ''}` || 'AU';
}

export default function ArticlesPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPosts, setTotalPosts] = useState(0);

    const fetchPosts = useCallback(async (showRefreshing = false) => {
        try {
            if (showRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setErrorMessage('');

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10',
                ...(searchQuery && { search: searchQuery }),
                ...(statusFilter !== 'all' && { status: statusFilter }),
            });

            const response = await apiClient.get<PostsPayload>(`/api/v1/posts?${params}`);
            const resolved = resolvePostsPayload(response);

            setPosts(resolved?.data || []);
            setTotalPages(resolved?.meta?.totalPages || 1);
            setTotalPosts(resolved?.meta?.total || 0);
        } catch {
            setPosts([]);
            setTotalPages(1);
            setTotalPosts(0);
            setErrorMessage('Khong the tai danh sach bai viet luc nay.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, searchQuery, statusFilter]);

    useEffect(() => {
        void fetchPosts();
    }, [fetchPosts]);

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setCurrentPage(1);
        setSearchQuery(searchInput.trim());
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Ban co chac muon xoa bai viet nay khong?')) {
            return;
        }

        try {
            await apiClient.delete(`/api/v1/posts/${id}`);
            toast.success('Da xoa bai viet');
            void fetchPosts(true);
        } catch {
            toast.error('Khong the xoa bai viet');
        }
    };

    const handleStatusChange = async (post: Post, status: Post['status']) => {
        try {
            await apiClient.put(`/api/v1/posts/${post.id}`, { status });
            toast.success(`Da chuyen bai viet sang ${status.toLowerCase()}`);
            void fetchPosts(true);
        } catch {
            toast.error('Khong the cap nhat trang thai bai viet');
        }
    };

    const summaryText = useMemo(() => {
        if (loading) return 'Dang tai du lieu bai viet...';
        if (errorMessage) return errorMessage;
        if (totalPosts === 0) return 'Chua co bai viet nao phu hop bo loc hien tai.';
        return `Trang ${currentPage}/${totalPages} - ${totalPosts} bai viet`;
    }, [currentPage, errorMessage, loading, totalPages, totalPosts]);

    return (
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Quan ly bai viet</h1>
                    <p className="mt-1 text-sm text-[#9dabb9]">
                        Tao, cap nhat va dieu phoi luong xuat ban cho blog.
                    </p>
                </div>
                <Link
                    href="/admin/articles/new"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Bai viet moi
                </Link>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-border-dark bg-[#1e293b] p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 flex-col gap-4 sm:flex-row">
                    <form onSubmit={handleSearch} className="group relative w-full sm:max-w-sm">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#9dabb9] transition-colors group-focus-within:text-primary">
                            search
                        </span>
                        <input
                            className="w-full rounded-lg border border-[#283039] bg-[#111418] py-2 pl-10 pr-4 text-sm text-white transition-all placeholder-[#586069] focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="Tim theo tieu de hoac slug..."
                            type="text"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                        />
                    </form>
                    <select
                        className="w-full cursor-pointer rounded-lg border border-[#283039] bg-[#111418] px-4 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary sm:w-44"
                        value={statusFilter}
                        onChange={(event) => {
                            setStatusFilter(event.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="all">Tat ca trang thai</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="DRAFT">Draft</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>
                </div>
                <div className="flex items-center justify-between gap-3 md:justify-end">
                    <span className="text-xs font-mono text-[#9dabb9]">{summaryText}</span>
                    <button
                        onClick={() => void fetchPosts(true)}
                        className="rounded-lg p-2 text-[#9dabb9] transition-colors hover:bg-[#283039] hover:text-white"
                        title="Lam moi danh sach"
                    >
                        <span className={`material-symbols-outlined ${refreshing ? 'animate-spin' : ''}`}>
                            refresh
                        </span>
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border-dark bg-[#1e293b] shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead className="border-b border-border-dark bg-[#283039]/50 text-xs font-bold uppercase tracking-wider text-[#9dabb9]">
                            <tr>
                                <th className="px-6 py-4">Article Details</th>
                                <th className="px-6 py-4">Author</th>
                                <th className="px-6 py-4">Published</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark text-sm text-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-[#9dabb9]">
                                        Dang tai danh sach bai viet...
                                    </td>
                                </tr>
                            ) : errorMessage ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-[#9dabb9]">
                                        <span className="material-symbols-outlined mb-2 block text-4xl text-[#fa6238]">warning</span>
                                        {errorMessage}
                                    </td>
                                </tr>
                            ) : posts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-[#9dabb9]">
                                        <span className="material-symbols-outlined mb-2 block text-4xl">article</span>
                                        Chua co bai viet nao. Hay tao bai viet dau tien.
                                    </td>
                                </tr>
                            ) : (
                                posts.map((post) => {
                                    const badge = getStatusBadge(post.status);

                                    return (
                                        <tr key={post.id} className="group transition-colors hover:bg-[#283039]/40">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <Link
                                                        href={`/admin/articles/${post.id}`}
                                                        className="line-clamp-1 text-base font-bold transition-colors hover:text-primary"
                                                    >
                                                        {post.title}
                                                    </Link>
                                                    <span className="text-xs font-mono text-[#9dabb9]">/{post.slug}</span>
                                                    {post.excerpt ? (
                                                        <p className="line-clamp-2 max-w-xl text-xs text-[#9dabb9]">
                                                            {post.excerpt}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary ring-2 ring-[#283039]">
                                                        {getAuthorInitials(post)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {post.author?.firstName} {post.author?.lastName}
                                                        </span>
                                                        <span className="text-xs text-[#9dabb9]">
                                                            {post._count?.comments || 0} comments
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {post.publishedAt ? (
                                                    <span className="font-medium">{formatDate(post.publishedAt)}</span>
                                                ) : (
                                                    <span className="italic text-[#586069]">--</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.bg} ${badge.text} ${badge.border}`}>
                                                    <span className={`size-1.5 rounded-full ${badge.dot}`} />
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity sm:opacity-60 group-hover:opacity-100">
                                                    <Link
                                                        href={`/admin/articles/${post.id}`}
                                                        className="rounded-lg p-2 text-[#9dabb9] transition-colors hover:bg-[#283039] hover:text-white"
                                                        title="Edit article"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit_square</span>
                                                    </Link>
                                                    {post.status === 'PUBLISHED' ? (
                                                        <button
                                                            onClick={() => void handleStatusChange(post, 'DRAFT')}
                                                            className="rounded-lg p-2 text-[#9dabb9] transition-colors hover:bg-[#283039] hover:text-yellow-400"
                                                            title="Unpublish"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">unpublished</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => void handleStatusChange(post, 'PUBLISHED')}
                                                            className="rounded-lg p-2 text-[#9dabb9] transition-colors hover:bg-[#283039] hover:text-green-400"
                                                            title="Publish"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">publish</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => void handleDelete(post.id)}
                                                        className="rounded-lg p-2 text-[#9dabb9] transition-colors hover:bg-[#283039] hover:text-[#fa6238]"
                                                        title="Delete article"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 ? (
                    <div className="flex items-center justify-between border-t border-border-dark bg-[#111418] px-6 py-4">
                        <div className="text-sm text-[#9dabb9]">
                            Page <span className="font-medium text-white">{currentPage}</span> of <span className="font-medium text-white">{totalPages}</span> ({totalPosts} total)
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="rounded-lg border border-border-dark px-3 py-1.5 text-sm font-medium text-[#9dabb9] transition-colors hover:bg-[#283039] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                                const page = index + 1;

                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${currentPage === page ? 'border-primary bg-primary text-white' : 'border-border-dark text-[#9dabb9] hover:bg-[#283039] hover:text-white'}`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-lg border border-border-dark px-3 py-1.5 text-sm font-medium text-[#9dabb9] transition-colors hover:bg-[#283039] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
