'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Skeleton } from '@/components/shared/skeleton';

type ComplianceOverviewPayload = {
    data?: {
        rangeDays: number;
        overview: {
            consentUpdates: number;
            analyticsOptIns: number;
            essentialOnlyCount: number;
            deletionRequests: number;
            dataExportRequests: number;
        };
        recentEvents: Array<{
            id: string;
            action: string;
            entity: string;
            userEmail?: string;
            createdAt: string;
            details?: Record<string, unknown>;
        }>;
    };
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function resolveEventSummary(event: {
    action: string;
    details?: Record<string, unknown>;
}) {
    if (event.action === 'CONSENT_UPDATE') {
        const status = String(event.details?.status || 'unknown');
        const analytics = event.details?.preferences &&
            typeof event.details.preferences === 'object' &&
            'analytics' in (event.details.preferences as Record<string, unknown>)
            ? Boolean((event.details.preferences as Record<string, unknown>).analytics)
            : false;

        return analytics
            ? `Consent saved (${status}, analytics allowed)`
            : `Consent saved (${status}, essential only)`;
    }

    if (event.action === 'ACCOUNT_DELETION_REQUEST') {
        return 'Account deletion request submitted';
    }

    if (event.action === 'DATA_EXPORT_REQUEST') {
        return 'Personal data export requested';
    }

    return event.action;
}

function ComplianceSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-5">
                {Array.from({ length: 5 }, (_, index) => (
                    <Skeleton key={index} className="h-28 rounded-3xl" />
                ))}
            </div>
            <Skeleton className="h-[420px] rounded-3xl" />
        </div>
    );
}

export default function CompliancePage() {
    const [rangeDays, setRangeDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [overview, setOverview] = useState<ComplianceOverviewPayload['data'] | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchOverview = async () => {
            try {
                setLoading(true);
                setErrorMessage('');
                const response = await apiClient.get<ComplianceOverviewPayload>(
                    `/api/v1/compliance/overview?days=${rangeDays}`
                );

                if (!isMounted) {
                    return;
                }

                setOverview(response?.data || null);
            } catch {
                if (isMounted) {
                    setErrorMessage('Khong the tai compliance overview luc nay.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void fetchOverview();

        return () => {
            isMounted = false;
        };
    }, [rangeDays]);

    const cards = useMemo(
        () => [
            {
                label: 'Consent Updates',
                value: overview?.overview.consentUpdates || 0,
                icon: 'cookie',
            },
            {
                label: 'Analytics Opt-ins',
                value: overview?.overview.analyticsOptIns || 0,
                icon: 'monitoring',
            },
            {
                label: 'Essential Only',
                value: overview?.overview.essentialOnlyCount || 0,
                icon: 'privacy_tip',
            },
            {
                label: 'Deletion Requests',
                value: overview?.overview.deletionRequests || 0,
                icon: 'delete_forever',
            },
            {
                label: 'Data Exports',
                value: overview?.overview.dataExportRequests || 0,
                icon: 'download',
            },
        ],
        [overview]
    );

    if (loading) {
        return <ComplianceSkeleton />;
    }

    return (
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
            <section className="theme-panel rounded-[28px] p-6 lg:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                            Compliance Ops
                        </p>
                        <h1 className="mt-3 text-3xl font-black tracking-tight text-[color:var(--text-main-theme)]">
                            Consent and privacy request visibility
                        </h1>
                        <p className="theme-muted mt-3 max-w-3xl text-sm leading-7">
                            Theo doi consent updates, analytics opt-ins, export requests va account
                            deletion requests tu dashboard admin.
                        </p>
                    </div>

                    <select
                        value={rangeDays}
                        onChange={(event) => setRangeDays(Number(event.target.value))}
                        className="theme-input h-11 rounded-2xl px-4 text-sm"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-5">
                {cards.map((card) => (
                    <article key={card.label} className="theme-panel rounded-3xl p-5">
                        <div className="flex items-center justify-between">
                            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                                <span className="material-symbols-outlined">{card.icon}</span>
                            </div>
                        </div>
                        <p className="theme-muted mt-4 text-xs font-semibold uppercase tracking-[0.18em]">
                            {card.label}
                        </p>
                        <p className="mt-2 text-3xl font-black text-[color:var(--text-main-theme)]">
                            {card.value}
                        </p>
                    </article>
                ))}
            </section>

            <section className="theme-panel overflow-hidden rounded-3xl">
                <div className="theme-border flex items-center justify-between border-b px-6 py-5">
                    <div>
                        <h2 className="text-lg font-bold text-[color:var(--text-main-theme)]">
                            Recent Compliance Events
                        </h2>
                        <p className="theme-muted mt-1 text-sm">
                            Latest consent saves and privacy/data rights requests.
                        </p>
                    </div>
                </div>

                {errorMessage ? (
                    <div className="px-6 py-4 text-sm text-red-400">{errorMessage}</div>
                ) : !overview?.recentEvents?.length ? (
                    <div className="px-6 py-8 text-sm text-[color:var(--text-muted-theme)]">
                        Chua co compliance event nao trong khoang thoi gian nay.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead className="theme-border border-b">
                                <tr className="text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted-theme)]">
                                    <th className="px-6 py-4 font-semibold">Event</th>
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">Details</th>
                                    <th className="px-6 py-4 font-semibold">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overview.recentEvents.map((event) => (
                                    <tr key={event.id} className="theme-border border-b last:border-b-0">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-[color:var(--text-main-theme)]">
                                                    {resolveEventSummary(event)}
                                                </p>
                                                <p className="theme-muted mt-1 text-xs">
                                                    {event.entity} / {event.action}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[color:var(--text-main-theme)]">
                                            {event.userEmail || 'Anonymous visitor'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[color:var(--text-muted-theme)]">
                                            <pre className="max-w-[480px] overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs">
                                                {JSON.stringify(event.details || {}, null, 2)}
                                            </pre>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[color:var(--text-muted-theme)]">
                                            {formatDate(event.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
