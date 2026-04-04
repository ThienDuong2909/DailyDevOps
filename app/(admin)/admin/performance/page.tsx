'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';
import { Skeleton } from '@/components/shared/skeleton';

type AnalyticsOverviewPayload = {
    rangeDays: number;
    overview: {
        pageViews: { total: number; change: string };
        searches: { total: number; change: string };
        newsletterSubscriptions: { total: number; change: string };
        commentSubmissions: { total: number; change: string };
    };
    topPages: Array<{
        path: string;
        views: number;
    }>;
    topSearches: Array<{
        term: string;
        searches: number;
        averageResults: number;
    }>;
    recentEvents: Array<{
        id: string;
        action: string;
        createdAt: string;
        details: {
            path?: string;
            title?: string;
            searchTerm?: string;
            resultsCount?: number;
            placement?: string;
            postSlug?: string;
        };
    }>;
};

const emptyAnalytics: AnalyticsOverviewPayload = {
    rangeDays: 30,
    overview: {
        pageViews: { total: 0, change: '0%' },
        searches: { total: 0, change: '0%' },
        newsletterSubscriptions: { total: 0, change: '0%' },
        commentSubmissions: { total: 0, change: '0%' },
    },
    topPages: [],
    topSearches: [],
    recentEvents: [],
};

function resolveData<T>(payload: unknown, fallback: T): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return ((payload as { data?: T }).data ?? fallback) as T;
    }

    return (payload as T) ?? fallback;
}

function getEventLabel(action: string) {
    switch (action) {
        case 'PAGE_VIEW':
            return 'Page view';
        case 'SEARCH':
            return 'Search';
        case 'NEWSLETTER_SUBSCRIBE':
            return 'Newsletter subscribe';
        case 'COMMENT_SUBMIT':
            return 'Comment submit';
        default:
            return action;
    }
}

function getEventDescription(event: AnalyticsOverviewPayload['recentEvents'][number]) {
    switch (event.action) {
        case 'PAGE_VIEW':
            return event.details.path || event.details.title || 'Unknown page';
        case 'SEARCH':
            return `${event.details.searchTerm || 'Unknown term'} (${event.details.resultsCount || 0} results)`;
        case 'NEWSLETTER_SUBSCRIBE':
            return event.details.placement || 'newsletter_form';
        case 'COMMENT_SUBMIT':
            return event.details.postSlug ? `/blog/${event.details.postSlug}` : 'Unknown post';
        default:
            return 'No details';
    }
}

function PerformanceSkeleton() {
    return (
        <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="theme-panel rounded-2xl p-5">
                        <Skeleton className="mb-3 h-4 w-28" />
                        <Skeleton className="mb-2 h-8 w-24" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Skeleton className="h-[360px] rounded-2xl" />
                <Skeleton className="h-[360px] rounded-2xl" />
            </div>
        </div>
    );
}

export default function PerformancePage() {
    const [analytics, setAnalytics] = useState<AnalyticsOverviewPayload>(emptyAnalytics);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let isMounted = true;

        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                setErrorMessage('');
                const response = await apiClient.get<unknown>('/api/v1/analytics/overview?days=30');

                if (!isMounted) {
                    return;
                }

                setAnalytics(resolveData(response, emptyAnalytics));
            } catch {
                if (isMounted) {
                    setAnalytics(emptyAnalytics);
                    setErrorMessage('Khong the tai analytics overview luc nay.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void fetchAnalytics();

        return () => {
            isMounted = false;
        };
    }, []);

    const statsCards = useMemo(
        () => [
            {
                label: 'Page Views',
                value: formatNumber(analytics.overview.pageViews.total),
                change: analytics.overview.pageViews.change,
                icon: 'visibility',
            },
            {
                label: 'Searches',
                value: formatNumber(analytics.overview.searches.total),
                change: analytics.overview.searches.change,
                icon: 'search',
            },
            {
                label: 'Newsletter Leads',
                value: formatNumber(analytics.overview.newsletterSubscriptions.total),
                change: analytics.overview.newsletterSubscriptions.change,
                icon: 'mail',
            },
            {
                label: 'Comment Conversions',
                value: formatNumber(analytics.overview.commentSubmissions.total),
                change: analytics.overview.commentSubmissions.change,
                icon: 'chat',
            },
        ],
        [analytics]
    );

    if (loading) {
        return <PerformanceSkeleton />;
    }

    return (
        <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
            {errorMessage ? (
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-xs text-yellow-300">
                    {errorMessage}
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((stat) => (
                    <div key={stat.label} className="theme-panel rounded-2xl p-5">
                        <div className="mb-3 flex items-start justify-between">
                            <p className="theme-muted text-sm font-medium">{stat.label}</p>
                            <span className="material-symbols-outlined rounded-lg bg-primary/10 p-1.5 text-lg text-primary">
                                {stat.icon}
                            </span>
                        </div>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-bold font-mono text-[color:var(--text-main-theme)]">
                                {stat.value}
                            </p>
                            <span
                                className={`mb-1 flex items-center text-xs font-medium ${
                                    stat.change.startsWith('-') ? 'text-[#fa6238]' : 'text-[#0bda5b]'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[14px]">
                                    {stat.change.startsWith('-') ? 'arrow_downward' : 'arrow_upward'}
                                </span>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="theme-panel overflow-hidden rounded-2xl">
                    <div className="theme-border border-b p-4">
                        <h3 className="text-base font-bold text-[color:var(--text-main-theme)]">
                            Top Pages
                        </h3>
                        <p className="theme-muted mt-1 text-xs">
                            Most viewed routes in the last {analytics.rangeDays} days
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="theme-border border-b bg-[color:var(--surface-muted)] text-xs font-medium uppercase theme-muted">
                                    <th className="p-4">#</th>
                                    <th className="p-4">Page Path</th>
                                    <th className="p-4 text-right">Views</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y theme-border">
                                {analytics.topPages.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="theme-muted p-6 text-center text-sm">
                                            Chua co page view events nao duoc ghi nhan.
                                        </td>
                                    </tr>
                                ) : (
                                    analytics.topPages.map((page, index) => (
                                        <tr key={`${page.path}-${index}`} className="transition-colors hover:bg-[color:var(--surface-muted)]">
                                            <td className="p-4 text-sm font-mono theme-soft">{index + 1}</td>
                                            <td className="p-4 text-sm font-mono text-primary">{page.path}</td>
                                            <td className="p-4 text-right text-sm font-mono text-[color:var(--text-main-theme)]">
                                                {formatNumber(page.views)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="theme-panel overflow-hidden rounded-2xl">
                    <div className="theme-border border-b p-4">
                        <h3 className="text-base font-bold text-[color:var(--text-main-theme)]">
                            Top Searches
                        </h3>
                        <p className="theme-muted mt-1 text-xs">
                            Most common public search terms
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="theme-border border-b bg-[color:var(--surface-muted)] text-xs font-medium uppercase theme-muted">
                                    <th className="p-4">#</th>
                                    <th className="p-4">Search Term</th>
                                    <th className="p-4 text-right">Searches</th>
                                    <th className="p-4 text-right">Avg. Results</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y theme-border">
                                {analytics.topSearches.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="theme-muted p-6 text-center text-sm">
                                            Chua co search events nao duoc ghi nhan.
                                        </td>
                                    </tr>
                                ) : (
                                    analytics.topSearches.map((item, index) => (
                                        <tr key={`${item.term}-${index}`} className="transition-colors hover:bg-[color:var(--surface-muted)]">
                                            <td className="p-4 text-sm font-mono theme-soft">{index + 1}</td>
                                            <td className="p-4 text-sm font-mono text-primary">{item.term}</td>
                                            <td className="p-4 text-right text-sm font-mono text-[color:var(--text-main-theme)]">
                                                {formatNumber(item.searches)}
                                            </td>
                                            <td className="p-4 text-right text-sm font-mono theme-muted">
                                                {formatNumber(item.averageResults)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="theme-panel overflow-hidden rounded-2xl">
                <div className="theme-border border-b p-4">
                    <h3 className="text-base font-bold text-[color:var(--text-main-theme)]">
                        Recent Product Events
                    </h3>
                    <p className="theme-muted mt-1 text-xs">
                        Newest tracked interactions from the public site
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="theme-border border-b bg-[color:var(--surface-muted)] text-xs font-medium uppercase theme-muted">
                                <th className="p-4">Time</th>
                                <th className="p-4">Event</th>
                                <th className="p-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y theme-border">
                            {analytics.recentEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="theme-muted p-6 text-center text-sm">
                                        Chua co event nao trong khung thoi gian nay.
                                    </td>
                                </tr>
                            ) : (
                                analytics.recentEvents.map((event) => (
                                    <tr key={event.id} className="transition-colors hover:bg-[color:var(--surface-muted)]">
                                        <td className="p-4 text-sm font-mono theme-muted">
                                            {formatDate(event.createdAt)}
                                        </td>
                                        <td className="p-4 text-sm font-semibold text-[color:var(--text-main-theme)]">
                                            {getEventLabel(event.action)}
                                        </td>
                                        <td className="p-4 text-sm theme-muted">
                                            {getEventDescription(event)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
