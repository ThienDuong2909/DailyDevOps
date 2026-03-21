'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { Post, PaginatedResponse } from '@/types';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

function getStatusBadge(status: string) {
    switch (status) {
        case 'PUBLISHED':
            return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', dot: 'bg-green-400', label: 'Published' };
        case 'DRAFT':
            return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', dot: 'bg-yellow-400', label: 'Draft' };
        case 'ARCHIVED':
            return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', dot: 'bg-gray-400', label: 'Archived' };
        default:
            return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', dot: 'bg-gray-400', label: status };
    }
}

export default function ArticlesPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPosts, setTotalPosts] = useState(0);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10',
                ...(searchQuery && { search: searchQuery }),
                ...(statusFilter !== 'all' && { status: statusFilter }),
            });
            const response = await apiClient.get<any>(`/api/v1/posts?${params}`);
            const responseData = response.data as any;
            // Handle both paginated { data: [...], meta: {...} } and direct array responses
            const postsData = Array.isArray(responseData) ? responseData : responseData?.data || [];
            setPosts(postsData);
            const meta = response?.meta || responseData?.meta;
            if (meta) {
                setTotalPages(meta.totalPages || 1);
                setTotalPosts(meta.total || 0);
            }
        } catch (error) {
            console.log('Using empty article list');
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [currentPage, statusFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchPosts();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this article?')) return;
        try {
            await apiClient.delete(`/api/v1/posts/${id}`);
            toast.success('Article deleted successfully');
            fetchPosts();
        } catch {
            toast.error('Failed to delete article');
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await apiClient.patch(`/api/v1/posts/${id}/status`, { status });
            toast.success(`Article ${status.toLowerCase()} successfully`);
            fetchPosts();
        } catch {
            toast.error('Failed to update article status');
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#1e293b] p-4 rounded-xl border border-border-dark">
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
                    <form onSubmit={handleSearch} className="relative w-full sm:w-72 group">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#9dabb9] group-focus-within:text-primary transition-colors">
                            search
                        </span>
                        <input
                            className="w-full bg-[#111418] text-white border border-[#283039] rounded-lg pl-10 pr-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary placeholder-[#586069] transition-all"
                            placeholder="Search articles by title..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                    <select
                        className="bg-[#111418] text-white border border-[#283039] rounded-lg px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-40 cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="all">All Status</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="DRAFT">Draft</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <span className="text-[#9dabb9] text-xs font-mono mr-2">
                        {totalPosts > 0 ? `Showing page ${currentPage} of ${totalPages}` : 'No results'}
                    </span>
                    <button
                        onClick={() => fetchPosts()}
                        className="p-2 text-[#9dabb9] hover:text-white hover:bg-[#283039] rounded-lg transition-colors"
                        title="Refresh list"
                    >
                        <span className="material-symbols-outlined">refresh</span>
                    </button>
                </div>
            </div>

            {/* Articles Table */}
            <div className="bg-[#1e293b] border border-border-dark rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#283039]/50 border-b border-border-dark text-[#9dabb9] text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-1/3">Article Details</th>
                                <th className="px-6 py-4">Author</th>
                                <th className="px-6 py-4">Published Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark text-sm text-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                                        </div>
                                    </td>
                                </tr>
                            ) : posts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-[#9dabb9]">
                                        <span className="material-symbols-outlined text-4xl mb-2 block">article</span>
                                        No articles found. Create your first article!
                                    </td>
                                </tr>
                            ) : (
                                posts.map((post) => {
                                    const badge = getStatusBadge(post.status);
                                    return (
                                        <tr key={post.id} className="hover:bg-[#283039]/40 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <Link
                                                        href={`/admin/articles/${post.id}`}
                                                        className="font-bold text-base hover:text-primary transition-colors line-clamp-1"
                                                    >
                                                        {post.title}
                                                    </Link>
                                                    <span className="text-xs text-[#9dabb9] font-mono">/{post.slug}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold ring-2 ring-[#283039]">
                                                        {post.author?.firstName?.[0]}{post.author?.lastName?.[0]}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {post.author?.firstName} {post.author?.lastName}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {post.publishedAt ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{formatDate(post.publishedAt)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[#586069] italic">--</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}>
                                                    <span className={`size-1.5 rounded-full ${badge.dot}`} />
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        href={`/admin/articles/${post.id}`}
                                                        className="p-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-[#283039] transition-colors"
                                                        title="Edit Article"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit_square</span>
                                                    </Link>
                                                    {post.status === 'PUBLISHED' ? (
                                                        <button
                                                            onClick={() => handleStatusChange(post.id, 'DRAFT')}
                                                            className="p-2 rounded-lg text-[#9dabb9] hover:text-yellow-400 hover:bg-[#283039] transition-colors"
                                                            title="Unpublish"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">unpublished</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleStatusChange(post.id, 'PUBLISHED')}
                                                            className="p-2 rounded-lg text-[#9dabb9] hover:text-green-400 hover:bg-[#283039] transition-colors"
                                                            title="Publish"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">publish</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(post.id)}
                                                        className="p-2 rounded-lg text-[#9dabb9] hover:text-[#fa6238] hover:bg-[#283039] transition-colors"
                                                        title="Delete"
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border-dark bg-[#111418]">
                        <div className="text-sm text-[#9dabb9]">
                            Page <span className="font-medium text-white">{currentPage}</span> of{' '}
                            <span className="font-medium text-white">{totalPages}</span>{' '}
                            ({totalPosts} total)
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg border border-border-dark text-sm font-medium text-[#9dabb9] hover:bg-[#283039] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = i + 1;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                                            currentPage === page
                                                ? 'border-primary bg-primary text-white'
                                                : 'border-border-dark text-[#9dabb9] hover:bg-[#283039] hover:text-white'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 rounded-lg border border-border-dark text-sm font-medium text-[#9dabb9] hover:bg-[#283039] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
