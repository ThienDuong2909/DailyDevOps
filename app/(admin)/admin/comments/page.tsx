'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Comment, PaginatedResponse } from '@/types';

const statusTabs = [
    { key: 'all', label: 'All Comments' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'SPAM', label: 'Spam' },
    { key: 'TRASH', label: 'Trash' },
];

const moderationQueues = [
    { key: 'all', label: 'All queues' },
    { key: 'guest', label: 'Guest review' },
    { key: 'risky', label: 'Risky content' },
    { key: 'reply', label: 'Replies' },
] as const;

function getStatusBadge(status: string) {
    switch (status) {
        case 'PENDING':
            return {
                icon: 'pending',
                bg: 'bg-yellow-500/10',
                text: 'text-yellow-500',
                border: 'border-yellow-500/20',
                label: 'Pending',
            };
        case 'APPROVED':
            return {
                icon: 'check',
                bg: 'bg-green-500/10',
                text: 'text-green-500',
                border: 'border-green-500/20',
                label: 'Approved',
            };
        case 'SPAM':
            return {
                icon: 'block',
                bg: 'bg-red-500/10',
                text: 'text-red-500',
                border: 'border-red-500/20',
                label: 'Spam',
            };
        case 'TRASH':
            return {
                icon: 'delete',
                bg: 'bg-gray-500/10',
                text: 'text-gray-500',
                border: 'border-gray-500/20',
                label: 'Trash',
            };
        default:
            return {
                icon: 'help',
                bg: 'bg-gray-500/10',
                text: 'text-gray-400',
                border: 'border-gray-500/20',
                label: status,
            };
    }
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function resolveCommentsResponse(payload: unknown): PaginatedResponse<Comment> {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        const outer = payload as {
            data?: unknown;
            meta?: unknown;
        };

        if (
            outer.data &&
            typeof outer.data === 'object' &&
            'data' in (outer.data as object)
        ) {
            const nested = outer.data as {
                data?: Comment[];
                meta?: PaginatedResponse<Comment>['meta'];
            };

            return {
                data: Array.isArray(nested.data) ? nested.data : [],
                meta: nested.meta || {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 0,
                },
            };
        }

        return {
            data: Array.isArray(outer.data) ? (outer.data as Comment[]) : [],
            meta: (outer.meta as PaginatedResponse<Comment>['meta']) || {
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            },
        };
    }

    return {
        data: [],
        meta: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
        },
    };
}

function getCommentSignals(comment: Comment) {
    const normalizedContent = (comment.content || '').toLowerCase();
    const linkCount = (comment.content.match(/https?:\/\/|www\./gi) || []).length;
    const hasRiskKeyword = ['telegram', 'whatsapp', 'backlink', 'casino', 'viagra', 'crypto giveaway'].some((keyword) =>
        normalizedContent.includes(keyword)
    );

    return {
        isGuest: !comment.user,
        hasLinks: linkCount > 0,
        hasManyLinks: linkCount >= 2,
        isReply: Boolean(comment.parentId),
        hasRiskKeyword,
        isRisky:
            comment.status === 'SPAM' ||
            hasRiskKeyword ||
            linkCount >= 2 ||
            Boolean(comment.authorIp && !comment.user),
    };
}

export default function CommentsPage() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalComments, setTotalComments] = useState(0);
    const [error, setError] = useState('');
    const [queueFilter, setQueueFilter] = useState<(typeof moderationQueues)[number]['key']>('all');

    const fetchComments = async (params?: {
        page?: number;
        status?: string;
        search?: string;
    }) => {
        try {
            setLoading(true);
            setError('');

            const query = new URLSearchParams({
                page: String(params?.page ?? currentPage),
                limit: '10',
                ...(params?.status || activeTab) !== 'all'
                    ? { status: params?.status || activeTab }
                    : {},
                ...((params?.search ?? searchQuery).trim()
                    ? { search: (params?.search ?? searchQuery).trim() }
                    : {}),
            });

            const response = await apiClient.get<unknown>(
                `/api/v1/comments?${query.toString()}`
            );
            const resolved = resolveCommentsResponse(response);
            setComments(resolved.data || []);
            setCurrentPage(resolved.meta?.page || 1);
            setTotalPages(resolved.meta?.totalPages || 1);
            setTotalComments(resolved.meta?.total || 0);
        } catch {
            setComments([]);
            setError('Failed to load comments moderation data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchComments();
    }, [activeTab, currentPage]);

    const stats = useMemo(() => {
        return comments.reduce(
            (acc, comment) => {
                const signals = getCommentSignals(comment);
                acc.total += 1;
                if (comment.status === 'PENDING') acc.pending += 1;
                if (comment.status === 'APPROVED') acc.approved += 1;
                if (comment.status === 'SPAM') acc.spam += 1;
                if (signals.isGuest) acc.guest += 1;
                if (signals.isRisky) acc.risky += 1;
                if (signals.isReply) acc.reply += 1;
                return acc;
            },
            { total: 0, pending: 0, approved: 0, spam: 0, guest: 0, risky: 0, reply: 0 }
        );
    }, [comments]);

    const visibleComments = useMemo(() => {
        return comments.filter((comment) => {
            const signals = getCommentSignals(comment);

            if (queueFilter === 'guest') {
                return signals.isGuest;
            }

            if (queueFilter === 'risky') {
                return signals.isRisky;
            }

            if (queueFilter === 'reply') {
                return signals.isReply;
            }

            return true;
        });
    }, [comments, queueFilter]);

    const handleSearch = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        await fetchComments({ page: 1, search: searchQuery });
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await apiClient.patch(`/api/v1/comments/${id}/status`, { status });
            toast.success(`Comment ${status.toLowerCase()}`);
            await fetchComments();
        } catch {
            toast.error('Failed to update comment');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this comment permanently?')) return;

        try {
            await apiClient.delete(`/api/v1/comments/${id}`);
            toast.success('Comment deleted');
            await fetchComments();
        } catch {
            toast.error('Failed to delete comment');
        }
    };

    const statCards = [
        {
            key: 'total',
            label: 'Visible Results',
            icon: 'chat_bubble',
            iconBg: 'bg-blue-500/10',
            iconColor: 'text-primary',
        },
        {
            key: 'pending',
            label: 'Pending',
            icon: 'pending',
            iconBg: 'bg-yellow-500/10',
            iconColor: 'text-yellow-500',
        },
        {
            key: 'approved',
            label: 'Approved',
            icon: 'check_circle',
            iconBg: 'bg-green-500/10',
            iconColor: 'text-green-500',
        },
        {
            key: 'spam',
            label: 'Spam',
            icon: 'report',
            iconBg: 'bg-red-500/10',
            iconColor: 'text-red-500',
        },
        {
            key: 'guest',
            label: 'Guest Queue',
            icon: 'person',
            iconBg: 'bg-violet-500/10',
            iconColor: 'text-violet-500',
        },
        {
            key: 'risky',
            label: 'Risk Signals',
            icon: 'warning',
            iconBg: 'bg-orange-500/10',
            iconColor: 'text-orange-500',
        },
    ] as const;

    return (
        <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
                {statCards.map((card) => (
                    <div
                        key={card.key}
                        className="theme-panel flex items-center gap-4 rounded-2xl p-4 transition-colors hover:border-primary/30"
                    >
                        <div
                            className={`flex size-10 items-center justify-center rounded-lg ${card.iconBg} ${card.iconColor}`}
                        >
                            <span className="material-symbols-outlined">
                                {card.icon}
                            </span>
                        </div>
                        <div>
                            <p className="theme-muted text-xs font-medium uppercase">
                                {card.label}
                            </p>
                            <h3 className="text-xl font-bold text-[color:var(--text-main-theme)]">
                                {stats[card.key].toLocaleString()}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="theme-panel flex flex-col overflow-hidden rounded-2xl shadow-sm">
                <div className="theme-border flex flex-col gap-4 border-b p-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => {
                                    setActiveTab(tab.key);
                                    setCurrentPage(1);
                                }}
                                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                    activeTab === tab.key
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'theme-muted hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text-main-theme)]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {moderationQueues.map((queue) => (
                            <button
                                key={queue.key}
                                onClick={() => setQueueFilter(queue.key)}
                                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                                    queueFilter === queue.key
                                        ? 'bg-primary/15 text-primary'
                                        : 'theme-panel-muted theme-border border text-[color:var(--text-main-theme)] hover:border-primary/40 hover:text-primary'
                                }`}
                            >
                                {queue.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <form
                            onSubmit={handleSearch}
                            className="relative w-full sm:max-w-md"
                        >
                            <span className="material-symbols-outlined theme-muted absolute left-3 top-1/2 -translate-y-1/2 text-[18px]">
                                search
                            </span>
                            <input
                                className="theme-input w-full rounded-2xl py-2 pl-10 pr-4 text-sm"
                                placeholder="Search by content, author or article..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>
                        <div className="theme-muted flex items-center gap-2 text-xs font-mono">
                            <span>{visibleComments.length}/{totalComments} visible in current queue</span>
                            <button
                                onClick={() => void fetchComments()}
                                className="theme-muted rounded-lg p-2 transition-colors hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text-main-theme)]"
                                title="Refresh comments"
                            >
                                <span className="material-symbols-outlined">
                                    refresh
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="custom-scrollbar overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="theme-border bg-[color:var(--surface-muted)] text-xs font-medium uppercase theme-muted border-b">
                                <th className="min-w-[220px] p-4">Author</th>
                                <th className="min-w-[420px] p-4">Comment</th>
                                <th className="min-w-[180px] p-4">Article</th>
                                <th className="min-w-[120px] p-4">Date</th>
                                <th className="min-w-[100px] p-4 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y theme-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center">
                                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="p-16 text-center text-red-400"
                                    >
                                        {error}
                                    </td>
                                </tr>
                            ) : visibleComments.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="theme-muted p-16 text-center"
                                    >
                                        <span className="material-symbols-outlined mb-2 block text-4xl">
                                            chat
                                        </span>
                                        No comments found
                                    </td>
                                </tr>
                            ) : (
                                visibleComments.map((comment) => {
                                    const badge = getStatusBadge(comment.status);
                                    const displayName = comment.user
                                        ? `${comment.user.firstName} ${comment.user.lastName}`
                                        : comment.authorName || 'Anonymous';
                                    const isSpam = comment.status === 'SPAM';
                                    const signals = getCommentSignals(comment);

                                    return (
                                        <tr
                                                key={comment.id}
                                                className={`group transition-colors ${
                                                    isSpam
                                                        ? 'bg-red-500/5 hover:bg-red-500/10'
                                                    : 'hover:bg-[color:var(--surface-muted)]'
                                                }`}
                                            >
                                            <td className="p-4 align-top">
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className={`flex size-10 items-center justify-center rounded-full text-sm font-bold ring-2 ring-[#283039] ${
                                                            comment.user
                                                                ? 'bg-primary/20 text-primary'
                                                                : isSpam
                                                                ? 'bg-gray-700 text-white'
                                                                : 'bg-gradient-to-tr from-pink-500 to-purple-500 text-white'
                                                        }`}
                                                    >
                                                        {isSpam ? (
                                                            <span className="material-symbols-outlined">
                                                                person_off
                                                            </span>
                                                        ) : (
                                                            getInitials(
                                                                displayName
                                                            )
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-[color:var(--text-main-theme)]">
                                                                {displayName}
                                                            </span>
                                                        {comment.user ? (
                                                            <span className="my-0.5 w-fit rounded bg-primary/20 px-1.5 text-[10px] font-bold text-primary">
                                                                MEMBER
                                                            </span>
                                                        ) : (
                                                            <span className="my-0.5 w-fit rounded bg-violet-500/15 px-1.5 text-[10px] font-bold text-violet-500">
                                                                GUEST
                                                            </span>
                                                        )}
                                                        {comment.authorEmail ? (
                                                            <span className="theme-muted text-xs">
                                                                {
                                                                    comment.authorEmail
                                                                }
                                                            </span>
                                                        ) : null}
                                                        {comment.authorIp ? (
                                                            <span className="theme-soft mt-1 font-mono text-[10px]">
                                                                {
                                                                    comment.authorIp
                                                                }
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="relative">
                                                    {comment.status ===
                                                    'PENDING' ? (
                                                        <div className="absolute -left-3 top-1 h-full w-1 rounded-full bg-yellow-500/50" />
                                                    ) : null}
                                                    <p
                                                        className={`mb-2 text-sm leading-relaxed text-[color:var(--text-main-theme)] ${
                                                            isSpam
                                                                ? 'line-through opacity-60'
                                                                : ''
                                                        }`}
                                                    >
                                                        {comment.content}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold ${badge.bg} ${badge.text} ${badge.border}`}
                                                        >
                                                            <span className="material-symbols-outlined text-[12px]">
                                                                {badge.icon}
                                                            </span>
                                                            {badge.label}
                                                        </span>
                                                        {comment.parentId ? (
                                                            <span className="theme-soft flex items-center gap-1 text-[10px]">
                                                                <span className="material-symbols-outlined text-[12px]">
                                                                    subdirectory_arrow_right
                                                                </span>
                                                                Reply
                                                            </span>
                                                        ) : null}
                                                        {signals.isGuest ? (
                                                            <span className="inline-flex items-center gap-1 rounded border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-500">
                                                                <span className="material-symbols-outlined text-[12px]">person</span>
                                                                Guest
                                                            </span>
                                                        ) : null}
                                                        {signals.hasManyLinks ? (
                                                            <span className="inline-flex items-center gap-1 rounded border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-500">
                                                                <span className="material-symbols-outlined text-[12px]">link</span>
                                                                Multi-link
                                                            </span>
                                                        ) : signals.hasLinks ? (
                                                            <span className="inline-flex items-center gap-1 rounded border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-500">
                                                                <span className="material-symbols-outlined text-[12px]">link</span>
                                                                Link
                                                            </span>
                                                        ) : null}
                                                        {signals.hasRiskKeyword ? (
                                                            <span className="inline-flex items-center gap-1 rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">
                                                                <span className="material-symbols-outlined text-[12px]">warning</span>
                                                                Risk keyword
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                {comment.post ? (
                                                    <div className="text-sm font-medium text-primary">
                                                        {comment.post.title}
                                                    </div>
                                                ) : (
                                                    <span className="theme-soft text-sm">
                                                        --
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 align-top">
                                                <span className="theme-muted text-sm">
                                                    {formatDate(
                                                        comment.createdAt
                                                    )}
                                                </span>
                                            </td>
                                            <td className="p-4 align-top text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                                                    {comment.status !== 'APPROVED' ? (
                                                        <button
                                                            onClick={() =>
                                                                void handleUpdateStatus(
                                                                    comment.id,
                                                                    'APPROVED'
                                                                )
                                                            }
                                                            className="rounded p-1.5 text-green-500 transition-colors hover:bg-green-500/10"
                                                            title="Approve"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">
                                                                check_circle
                                                            </span>
                                                        </button>
                                                    ) : null}
                                                    {comment.status ===
                                                    'APPROVED' ? (
                                                        <button
                                                            onClick={() =>
                                                                void handleUpdateStatus(
                                                                    comment.id,
                                                                    'PENDING'
                                                                )
                                                            }
                                                            className="rounded p-1.5 text-orange-400 transition-colors hover:bg-orange-400/10"
                                                            title="Keep in review"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">
                                                                pending
                                                            </span>
                                                        </button>
                                                    ) : null}
                                                    {comment.status !== 'TRASH' ? (
                                                        <button
                                                            onClick={() =>
                                                                void handleUpdateStatus(
                                                                    comment.id,
                                                                    'TRASH'
                                                                )
                                                            }
                                                            className="theme-muted rounded p-1.5 transition-colors hover:bg-gray-500/10 hover:text-gray-400"
                                                            title="Move to trash"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">
                                                                delete
                                                            </span>
                                                        </button>
                                                    ) : null}
                                                    {comment.status !==
                                                    'SPAM' ? (
                                                        <button
                                                            onClick={() =>
                                                                void handleUpdateStatus(
                                                                    comment.id,
                                                                    'SPAM'
                                                                )
                                                            }
                                                            className="theme-muted rounded p-1.5 transition-colors hover:bg-red-400/10 hover:text-red-400"
                                                            title="Mark as spam"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">
                                                                report
                                                            </span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                void handleUpdateStatus(
                                                                    comment.id,
                                                                    'APPROVED'
                                                                )
                                                            }
                                                            className="rounded p-1.5 text-green-500 transition-colors hover:bg-green-500/10"
                                                            title="Not spam"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">
                                                                check_circle
                                                            </span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            void handleDelete(
                                                                comment.id
                                                            )
                                                        }
                                                        className="theme-muted rounded p-1.5 transition-colors hover:bg-red-500/10 hover:text-red-500"
                                                        title="Delete"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">
                                                            {isSpam
                                                                ? 'delete_forever'
                                                                : 'delete'}
                                                        </span>
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
                    <div className="theme-border flex items-center justify-between border-t px-6 py-4">
                        <div className="theme-muted text-sm">
                            Page{' '}
                            <span className="font-medium text-[color:var(--text-main-theme)]">
                                {currentPage}
                            </span>{' '}
                            of{' '}
                            <span className="font-medium text-[color:var(--text-main-theme)]">
                                {totalPages}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    setCurrentPage((value) =>
                                        Math.max(1, value - 1)
                                    )
                                }
                                disabled={currentPage === 1}
                                className="theme-panel-muted theme-border rounded-lg border px-3 py-1.5 text-sm font-medium theme-muted transition-colors hover:text-[color:var(--text-main-theme)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() =>
                                    setCurrentPage((value) =>
                                        Math.min(totalPages, value + 1)
                                    )
                                }
                                disabled={currentPage === totalPages}
                                className="theme-panel-muted theme-border rounded-lg border px-3 py-1.5 text-sm font-medium theme-muted transition-colors hover:text-[color:var(--text-main-theme)] disabled:cursor-not-allowed disabled:opacity-50"
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
