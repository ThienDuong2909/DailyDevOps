'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';
import type { DashboardStats, Post } from '@/types';

const sampleLogs = [
    { time: '10:42:01', type: 'INFO', message: 'Started scheduled backup.' },
    { time: '10:42:05', type: 'INFO', message: 'Backup completed in 4.2s.' },
    { time: '10:45:12', type: 'GET', message: '/api/v1/posts/stats 200 OK' },
    { time: '10:48:00', type: 'WARN', message: 'Cache hit ratio dipped below target.' },
    { time: '10:48:02', type: 'INFO', message: 'Metrics pipeline remains healthy.' },
    { time: '10:55:00', type: 'GET', message: '/metrics 200 OK' },
];

interface SubscribersStats {
    total: number;
    active: number;
    inactive: number;
}

interface DashboardState {
    comments: DashboardStats['comments'];
    posts: DashboardStats['posts'];
    users: DashboardStats['users'];
    subscribers: SubscribersStats;
}

const emptyDashboard: DashboardState = {
    comments: {
        total: 0,
        byStatus: {
            PENDING: 0,
            APPROVED: 0,
            SPAM: 0,
            TRASH: 0,
        },
    },
    posts: {
        total: 0,
        totalViews: 0,
        byStatus: {
            DRAFT: 0,
            PUBLISHED: 0,
            SCHEDULED: 0,
            ARCHIVED: 0,
        },
        recentPosts: [],
    },
    users: {
        total: 0,
        active: 0,
        byRole: {
            ADMIN: 0,
            MODERATOR: 0,
            EDITOR: 0,
            VIEWER: 0,
        },
    },
    subscribers: {
        total: 0,
        active: 0,
        inactive: 0,
    },
};

function getLogTypeColor(type: string) {
    switch (type) {
        case 'INFO':
            return 'text-[#0bda5b]';
        case 'GET':
        case 'POST':
            return 'text-[#137fec]';
        case 'WARN':
            return 'text-[#eab308]';
        case 'ERR':
            return 'text-[#fa6238]';
        default:
            return 'text-white';
    }
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'PUBLISHED':
            return 'bg-green-900/30 text-green-400 border-green-900';
        case 'DRAFT':
            return 'bg-yellow-900/30 text-yellow-400 border-yellow-900';
        case 'ARCHIVED':
            return 'bg-gray-900/30 text-gray-400 border-gray-900';
        default:
            return 'bg-blue-900/30 text-blue-400 border-blue-900';
    }
}

function resolveData<T>(payload: unknown, fallback: T): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return ((payload as { data?: T }).data ?? fallback) as T;
    }

    return (payload as T) ?? fallback;
}

export default function AdminDashboardPage() {
    const [dashboard, setDashboard] = useState<DashboardState>(emptyDashboard);
    const [loading, setLoading] = useState(true);
    const [usingFallback, setUsingFallback] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchDashboard = async () => {
            try {
                const [
                    commentsStatsResponse,
                    postsStatsResponse,
                    subscribersStatsResponse,
                    usersStatsResponse,
                ] =
                    await Promise.all([
                        apiClient.get<unknown>('/api/v1/comments/stats'),
                        apiClient.get<unknown>('/api/v1/posts/stats'),
                        apiClient.get<unknown>('/api/v1/subscribers/stats'),
                        apiClient.get<unknown>('/api/v1/users/stats'),
                    ]);

                if (!isMounted) {
                    return;
                }

                const comments = resolveData<DashboardStats['comments']>(
                    commentsStatsResponse,
                    emptyDashboard.comments
                );
                const posts = resolveData<DashboardStats['posts']>(
                    postsStatsResponse,
                    emptyDashboard.posts
                );
                const subscribers = resolveData<SubscribersStats>(
                    subscribersStatsResponse,
                    emptyDashboard.subscribers
                );
                const users = resolveData<DashboardStats['users']>(
                    usersStatsResponse,
                    emptyDashboard.users
                );

                setDashboard({
                    comments: {
                        ...emptyDashboard.comments,
                        ...comments,
                        byStatus: {
                            ...emptyDashboard.comments.byStatus,
                            ...(comments?.byStatus || {}),
                        },
                    },
                    posts: {
                        ...emptyDashboard.posts,
                        ...posts,
                        byStatus: {
                            ...emptyDashboard.posts.byStatus,
                            ...(posts?.byStatus || {}),
                        },
                        recentPosts: posts?.recentPosts || [],
                    },
                    subscribers: {
                        ...emptyDashboard.subscribers,
                        ...subscribers,
                    },
                    users: {
                        ...emptyDashboard.users,
                        ...users,
                        byRole: {
                            ...emptyDashboard.users.byRole,
                            ...(users?.byRole || {}),
                        },
                    },
                });
                setUsingFallback(false);
            } catch {
                if (!isMounted) {
                    return;
                }

                setDashboard(emptyDashboard);
                setUsingFallback(true);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void fetchDashboard();

        return () => {
            isMounted = false;
        };
    }, []);

    const statsCards = useMemo(
        () => [
            {
                label: 'Total Views',
                value: formatNumber(dashboard.posts.totalViews),
                hint: `${dashboard.posts.byStatus.PUBLISHED || 0} published posts`,
                icon: 'visibility',
            },
            {
                label: 'Pending Comments',
                value: dashboard.comments.byStatus.PENDING || 0,
                hint: `${dashboard.comments.total} total comments`,
                icon: 'forum',
            },
            {
                label: 'Active Users',
                value: formatNumber(dashboard.users.active),
                hint: `${dashboard.users.total} total users`,
                icon: 'group',
            },
            {
                label: 'Subscribers',
                value: formatNumber(dashboard.subscribers.active),
                hint: `${dashboard.subscribers.inactive} inactive`,
                icon: 'group_add',
            },
        ],
        [dashboard]
    );

    return (
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-white">Overview</h1>
                <p className="text-sm text-[#9dabb9]">
                    Operational snapshot for content, traffic and subscriber
                    growth.
                </p>
                {usingFallback ? (
                    <p className="text-xs text-yellow-400">
                        Dashboard is showing fallback values because the stats
                        endpoints did not respond.
                    </p>
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((card) => (
                    <div
                        key={card.label}
                        className="group flex flex-col gap-3 rounded-xl border border-border-dark bg-[#1e293b] p-5 transition-colors hover:border-primary/50"
                    >
                        <div className="flex items-start justify-between">
                            <p className="text-sm font-medium text-[#9dabb9]">
                                {card.label}
                            </p>
                            <span className="material-symbols-outlined rounded-lg bg-primary/10 p-1.5 text-lg text-primary">
                                {card.icon}
                            </span>
                        </div>
                        <div className="flex items-end gap-2">
                            <p className="font-mono text-2xl font-bold text-white">
                                {loading ? '--' : card.value}
                            </p>
                        </div>
                        <p className="text-xs text-[#9dabb9]">{card.hint}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="flex flex-col rounded-xl border border-border-dark bg-[#1e293b] p-6 xl:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                Content Pipeline
                            </h2>
                            <p className="mt-1 text-xs text-[#9dabb9]">
                                Real-time distribution for posts and comment
                                moderation.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9dabb9]">
                                    Posts
                                </h3>
                                <span className="text-xs font-mono text-[#9dabb9]">
                                    {dashboard.posts.total} total
                                </span>
                            </div>
                        {Object.entries(dashboard.posts.byStatus).map(
                            ([status, count]) => {
                                const total = Math.max(dashboard.posts.total, 1);
                                const width = `${Math.round((count / total) * 100)}%`;

                                return (
                                    <div key={status} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-white">
                                                {status}
                                            </span>
                                            <span className="font-mono text-[#9dabb9]">
                                                {count}
                                            </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-[#283039]">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all"
                                                style={{ width }}
                                            />
                                        </div>
                                    </div>
                                );
                            }
                        )}
                        </div>
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9dabb9]">
                                    Comments
                                </h3>
                                <span className="text-xs font-mono text-[#9dabb9]">
                                    {dashboard.comments.total} total
                                </span>
                            </div>
                            {Object.entries(dashboard.comments.byStatus).map(
                                ([status, count]) => {
                                    const total = Math.max(
                                        dashboard.comments.total,
                                        1
                                    );
                                    const width = `${Math.round(
                                        (count / total) * 100
                                    )}%`;

                                    return (
                                        <div key={status} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-white">
                                                    {status}
                                                </span>
                                                <span className="font-mono text-[#9dabb9]">
                                                    {count}
                                                </span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-[#283039]">
                                                <div
                                                    className="h-full rounded-full bg-cyan-500 transition-all"
                                                    style={{ width }}
                                                />
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col rounded-xl border border-border-dark bg-[#0f1216] shadow-inner">
                    <div className="flex items-center justify-between rounded-t-xl border-b border-[#283039] bg-[#161b22] px-4 py-3">
                        <div className="flex gap-2">
                            <div className="size-3 rounded-full bg-[#fa6238]" />
                            <div className="size-3 rounded-full bg-[#eab308]" />
                            <div className="size-3 rounded-full bg-[#0bda5b]" />
                        </div>
                        <span className="font-mono text-xs text-[#9dabb9]">
                            ops-feed
                        </span>
                    </div>
                    <div className="custom-scrollbar flex-1 overflow-y-auto p-4 font-mono text-xs text-white">
                        <div className="flex flex-col gap-1.5">
                            {sampleLogs.map((log, index) => (
                                <div key={index} className="flex gap-2">
                                    <span className="text-[#586069]">
                                        {log.time}
                                    </span>
                                    <span className={getLogTypeColor(log.type)}>
                                        {log.type}
                                    </span>
                                    <span>{log.message}</span>
                                </div>
                            ))}
                            <div className="flex gap-2 text-[#9dabb9] animate-pulse">
                                _
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 pb-6 xl:grid-cols-3">
                <div className="flex flex-col overflow-hidden rounded-xl border border-border-dark bg-[#1e293b] xl:col-span-2">
                    <div className="flex items-center justify-between border-b border-border-dark bg-[#111418] p-5">
                        <h2 className="text-base font-bold text-white">
                            Recent Articles
                        </h2>
                        <Link
                            href="/admin/articles"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            View All
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead className="bg-[#283039] text-xs font-semibold uppercase text-[#9dabb9]">
                                <tr>
                                    <th className="px-6 py-4">Article Title</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Published</th>
                                    <th className="px-6 py-4">Views</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-dark text-sm text-white">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-16 text-center text-[#9dabb9]"
                                        >
                                            Loading dashboard data...
                                        </td>
                                    </tr>
                                ) : dashboard.posts.recentPosts.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-16 text-center text-[#9dabb9]"
                                        >
                                            No recent posts available yet.
                                        </td>
                                    </tr>
                                ) : (
                                    dashboard.posts.recentPosts.map(
                                        (post: Post) => (
                                            <tr
                                                key={post.id}
                                                className="transition-colors hover:bg-[#283039]/50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-medium">
                                                        {post.title}
                                                    </div>
                                                    <div className="text-xs text-[#9dabb9]">
                                                        /{post.slug}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(
                                                            post.status
                                                        )}`}
                                                    >
                                                        {post.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-[#9dabb9]">
                                                    {post.publishedAt
                                                        ? formatDate(
                                                              post.publishedAt
                                                          )
                                                        : '--'}
                                                </td>
                                                <td className="px-6 py-4 font-mono">
                                                    {formatNumber(
                                                        post.viewCount || 0
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-col rounded-xl border border-border-dark bg-[#1e293b] p-6">
                    <h2 className="mb-6 text-base font-bold text-white">
                        Audience and Access
                    </h2>
                    <div className="space-y-8">
                        <div className="space-y-5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[#9dabb9]">Active Users</span>
                                <span className="font-bold text-white">
                                    {dashboard.users.active}
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-[#283039]">
                                <div
                                    className="h-full rounded-full bg-primary"
                                    style={{
                                        width: `${
                                            dashboard.users.total
                                                ? Math.round(
                                                      (dashboard.users.active /
                                                          dashboard.users.total) *
                                                          100
                                                  )
                                                : 0
                                        }%`,
                                    }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-[#9dabb9]">
                                {Object.entries(dashboard.users.byRole).map(
                                    ([role, count]) => (
                                        <div
                                            key={role}
                                            className="rounded-lg bg-[#111418] px-3 py-2"
                                        >
                                            <span className="block">{role}</span>
                                            <span className="font-mono text-white">
                                                {count}
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9dabb9]">
                                    Subscribers
                                </h3>
                                <span className="text-xs font-mono text-[#9dabb9]">
                                    {dashboard.subscribers.total} total
                                </span>
                            </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#9dabb9]">Active</span>
                                <span className="font-bold text-white">
                                    {dashboard.subscribers.active}
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-[#283039]">
                                <div
                                    className="h-full rounded-full bg-[#0bda5b]"
                                    style={{
                                        width: `${
                                            dashboard.subscribers.total
                                                ? Math.round(
                                                      (dashboard.subscribers
                                                          .active /
                                                          dashboard.subscribers
                                                              .total) *
                                                          100
                                                  )
                                                : 0
                                        }%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#9dabb9]">Inactive</span>
                                <span className="font-bold text-white">
                                    {dashboard.subscribers.inactive}
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-[#283039]">
                                <div
                                    className="h-full rounded-full bg-[#fa6238]"
                                    style={{
                                        width: `${
                                            dashboard.subscribers.total
                                                ? Math.round(
                                                      (dashboard.subscribers
                                                          .inactive /
                                                          dashboard.subscribers
                                                              .total) *
                                                          100
                                                  )
                                                : 0
                                        }%`,
                                    }}
                                />
                            </div>
                        </div>
                        </div>
                    </div>
                    <div className="mt-8 rounded-xl border border-border-dark bg-[#111418] p-4">
                        <p className="text-xs uppercase tracking-wide text-[#9dabb9]">
                            Total Reach
                        </p>
                        <p className="mt-2 font-mono text-3xl font-bold text-white">
                            {formatNumber(
                                dashboard.subscribers.total + dashboard.users.total
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
