'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getAccessToken } from '@/lib/auth';

type ExportOptions = {
    includeDrafts: boolean;
    includeActivityLogs: boolean;
};

export default function AdminOpsPage() {
    const [options, setOptions] = useState<ExportOptions>({
        includeDrafts: true,
        includeActivityLogs: false,
    });
    const [isExporting, setIsExporting] = useState(false);

    const summaryCards = useMemo(
        () => [
            {
                label: 'What it exports',
                value: 'Posts, categories, tags, subscribers, users, settings, comments',
            },
            {
                label: 'Format',
                value: 'Single JSON snapshot for audit, backup checks, and restore planning',
            },
            {
                label: 'Audit trail',
                value: 'Each export request is logged into activity_logs as OPS_EXPORT_REQUEST',
            },
        ],
        []
    );

    const handleExport = async () => {
        try {
            setIsExporting(true);

            const params = new URLSearchParams({
                includeDrafts: String(options.includeDrafts),
                includeActivityLogs: String(options.includeActivityLogs),
            });

            const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
            const response = await fetch(`${apiBase}/api/v1/ops/export?${params.toString()}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${getAccessToken() || ''}`,
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new Error(payload?.error || 'Khong the tao operational export');
            }

            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            const disposition = response.headers.get('Content-Disposition') || '';
            const fileNameMatch = disposition.match(/filename="([^"]+)"/);
            anchor.href = downloadUrl;
            anchor.download = fileNameMatch?.[1] || 'devopsdaily-ops-export.json';
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(downloadUrl);

            toast.success('Da tao operational export thanh cong');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Khong the tao export');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
            <section className="theme-panel rounded-[28px] p-6 lg:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Backup & Export
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-[color:var(--text-main-theme)]">
                    Operational snapshot for backup and restore readiness
                </h1>
                <p className="theme-muted mt-3 max-w-3xl text-sm leading-7">
                    Tai mot JSON snapshot cua du lieu cot loi de doi van hanh co the kiem tra,
                    luu tru, doi chieu va chuan bi restore drill. Day la operational export,
                    khong phai full physical database dump.
                </p>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                {summaryCards.map((card) => (
                    <article key={card.label} className="theme-panel rounded-3xl p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            {card.label}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-[color:var(--text-main-theme)]">
                            {card.value}
                        </p>
                    </article>
                ))}
            </section>

            <section className="theme-panel rounded-3xl p-6">
                <h2 className="text-xl font-bold text-[color:var(--text-main-theme)]">
                    Export Options
                </h2>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <label className="theme-panel-muted flex items-start gap-4 rounded-2xl border border-[color:var(--border-theme)] p-4">
                        <input
                            type="checkbox"
                            checked={options.includeDrafts}
                            onChange={(event) =>
                                setOptions((current) => ({
                                    ...current,
                                    includeDrafts: event.target.checked,
                                }))
                            }
                            className="mt-1 size-4 accent-[var(--primary-theme)]"
                        />
                        <div>
                            <p className="text-sm font-semibold text-[color:var(--text-main-theme)]">
                                Include non-published content
                            </p>
                            <p className="theme-muted mt-2 text-sm leading-6">
                                Bao gom draft, review va scheduled posts trong export.
                            </p>
                        </div>
                    </label>

                    <label className="theme-panel-muted flex items-start gap-4 rounded-2xl border border-[color:var(--border-theme)] p-4">
                        <input
                            type="checkbox"
                            checked={options.includeActivityLogs}
                            onChange={(event) =>
                                setOptions((current) => ({
                                    ...current,
                                    includeActivityLogs: event.target.checked,
                                }))
                            }
                            className="mt-1 size-4 accent-[var(--primary-theme)]"
                        />
                        <div>
                            <p className="text-sm font-semibold text-[color:var(--text-main-theme)]">
                                Include recent activity logs
                            </p>
                            <p className="theme-muted mt-2 text-sm leading-6">
                                Them toi da 500 activity log entries de doi chieu audit gan nhat.
                            </p>
                        </div>
                    </label>
                </div>

                <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm font-semibold text-[color:var(--text-main-theme)]">
                        Recommended usage
                    </p>
                    <p className="theme-muted mt-2 text-sm leading-6">
                        Dung export nay truoc moi release lon, truoc/ sau schema sync, va khi chay
                        restore drill. Neu can physical backup, tiep tuc dung database backup o tang
                        ha tang ben ngoai repo.
                    </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => void handleExport()}
                        disabled={isExporting}
                        className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                        {isExporting ? 'Dang tao export...' : 'Download Operational Export'}
                    </button>
                </div>
            </section>
        </div>
    );
}
