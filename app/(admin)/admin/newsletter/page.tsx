'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';

type SubscriberStatus = 'PENDING' | 'CONFIRMED' | 'UNSUBSCRIBED';

interface SubscriberItem {
    id: string;
    email: string;
    name?: string | null;
    status: SubscriberStatus;
    isActive: boolean;
    confirmedAt?: string | null;
    subscribedAt: string;
    unsubscribedAt?: string | null;
}

interface SubscribersResponse {
    data?: SubscriberItem[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

interface SubscriberStats {
    total: number;
    active: number;
    inactive: number;
    pending: number;
    confirmed: number;
}

const statusFilters: Array<{ label: string; value: 'all' | SubscriberStatus }> = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Unsubscribed', value: 'UNSUBSCRIBED' },
];

function resolveData<T>(payload: unknown, fallback: T): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return ((payload as { data?: T }).data ?? fallback) as T;
    }

    return (payload as T) ?? fallback;
}

export default function AdminNewsletterPage() {
    const [stats, setStats] = useState<SubscriberStats>({
        total: 0,
        active: 0,
        inactive: 0,
        pending: 0,
        confirmed: 0,
    });
    const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<'all' | SubscriberStatus>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchNewsletterData = async () => {
            try {
                setLoading(true);
                const query =
                    selectedStatus === 'all'
                        ? '/api/v1/subscribers?limit=50'
                        : `/api/v1/subscribers?limit=50&status=${selectedStatus}`;

                const [statsResponse, subscribersResponse] = await Promise.all([
                    apiClient.get<unknown>('/api/v1/subscribers/stats'),
                    apiClient.get<SubscribersResponse>(query),
                ]);

                if (!isMounted) {
                    return;
                }

                setStats(
                    resolveData<SubscriberStats>(statsResponse, {
                        total: 0,
                        active: 0,
                        inactive: 0,
                        pending: 0,
                        confirmed: 0,
                    })
                );
                setSubscribers(subscribersResponse?.data || []);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void fetchNewsletterData();

        return () => {
            isMounted = false;
        };
    }, [selectedStatus]);

    const cards = useMemo(
        () => [
            { label: 'Total Subscribers', value: stats.total, hint: 'All newsletter records' },
            { label: 'Confirmed', value: stats.confirmed, hint: 'Ready for delivery' },
            { label: 'Pending', value: stats.pending, hint: 'Waiting for double opt-in' },
            { label: 'Inactive', value: stats.inactive, hint: 'Unsubscribed or inactive' },
        ],
        [stats]
    );

    const statusPillClass = (status: SubscriberStatus) => {
        switch (status) {
            case 'CONFIRMED':
                return 'border-green-500/30 bg-green-500/10 text-green-300';
            case 'UNSUBSCRIBED':
                return 'border-red-500/30 bg-red-500/10 text-red-300';
            default:
                return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200';
        }
    };

    return (
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-[color:var(--text-main-theme)]">Newsletter Ops</h1>
                <p className="theme-muted text-sm">
                    Track subscriber growth, double opt-in progress, and unsubscribe state from one
                    workspace.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="theme-panel rounded-2xl p-5"
                    >
                        <p className="theme-muted text-sm font-medium">{card.label}</p>
                        <p className="mt-3 font-mono text-2xl font-bold text-[color:var(--text-main-theme)]">
                            {loading ? '--' : formatNumber(card.value)}
                        </p>
                        <p className="theme-muted mt-2 text-xs">{card.hint}</p>
                    </div>
                ))}
            </div>

            <div className="theme-panel rounded-2xl p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[color:var(--text-main-theme)]">Subscriber List</h2>
                        <p className="theme-muted mt-1 text-xs">
                            Filter by subscription state to inspect pending and confirmed cohorts.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {statusFilters.map((filter) => (
                            <button
                                key={filter.value}
                                type="button"
                                onClick={() => setSelectedStatus(filter.value)}
                                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                                    selectedStatus === filter.value
                                        ? 'bg-primary text-white'
                                        : 'theme-panel-muted theme-border border text-[color:var(--text-muted-theme)] hover:border-primary hover:text-primary'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead className="bg-[color:var(--surface-muted)] text-xs font-semibold uppercase theme-muted">
                            <tr>
                                <th className="px-4 py-3">Subscriber</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Subscribed</th>
                                <th className="px-4 py-3">Confirmed</th>
                                <th className="px-4 py-3">Last Lifecycle Event</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y theme-border text-sm text-[color:var(--text-main-theme)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="theme-muted px-4 py-10 text-center">
                                        Loading newsletter data...
                                    </td>
                                </tr>
                            ) : subscribers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="theme-muted px-4 py-10 text-center">
                                        No subscribers match the current filter.
                                    </td>
                                </tr>
                            ) : (
                                subscribers.map((subscriber) => (
                                    <tr key={subscriber.id} className="hover:bg-[color:var(--surface-muted)]">
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="font-semibold">{subscriber.name || subscriber.email}</p>
                                                <p className="theme-muted text-xs">{subscriber.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusPillClass(
                                                    subscriber.status
                                                )}`}
                                            >
                                                {subscriber.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 theme-muted">
                                            {formatDate(subscriber.subscribedAt)}
                                        </td>
                                        <td className="px-4 py-4 theme-muted">
                                            {subscriber.confirmedAt ? formatDate(subscriber.confirmedAt) : '--'}
                                        </td>
                                        <td className="px-4 py-4 theme-muted">
                                            {subscriber.unsubscribedAt
                                                ? `Unsubscribed ${formatDate(subscriber.unsubscribedAt)}`
                                                : subscriber.confirmedAt
                                                  ? `Confirmed ${formatDate(subscriber.confirmedAt)}`
                                                  : 'Awaiting confirmation'}
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
