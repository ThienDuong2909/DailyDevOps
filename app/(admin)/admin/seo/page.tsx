'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Skeleton } from '@/components/shared/skeleton';
import toast from 'react-hot-toast';

interface SeoOverview {
    healthScore: number;
    indexedPages: number;
    criticalIssues: number;
    organicTrafficChange: string;
}

interface SeoGlobalSettings {
    searchIndexing: boolean;
    homepageTitleSuffix: string;
    robotsTxt: string;
    analyticsId: string;
}

interface SeoPageRecord {
    pageType: string;
    id?: string;
    title: string;
    slug: string;
    metaTitle: string;
    metaDescription: string;
    canonicalUrl: string;
    focusKeywords: string[];
    ogImage: string;
    noIndex: boolean;
    noFollow: boolean;
    score?: number;
    issues?: string[];
}

interface SeoKeyword {
    term: string;
    position: number;
    mentions: number;
}

interface SeoSuggestion {
    type: 'error' | 'warning' | 'info';
    title: string;
    description: string;
}

interface SeoDashboardPayload {
    overview: SeoOverview;
    globalSettings: SeoGlobalSettings;
    homepage: SeoPageRecord;
    pages: SeoPageRecord[];
    topKeywords: SeoKeyword[];
    suggestions: SeoSuggestion[];
}

const emptyDashboard: SeoDashboardPayload = {
    overview: {
        healthScore: 0,
        indexedPages: 0,
        criticalIssues: 0,
        organicTrafficChange: '+0.0%',
    },
    globalSettings: {
        searchIndexing: true,
        homepageTitleSuffix: ' | DevOps Blog',
        robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /admin/',
        analyticsId: '',
    },
    homepage: {
        pageType: 'home',
        title: 'DevOps Blog',
        slug: '/',
        metaTitle: 'DevOps Blog',
        metaDescription: '',
        canonicalUrl: 'https://dailydevops.blog/',
        focusKeywords: [],
        ogImage: '',
        noIndex: false,
        noFollow: false,
        score: 0,
        issues: [],
    },
    pages: [],
    topKeywords: [],
    suggestions: [],
};

function resolveData<T>(payload: unknown, fallback: T): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return ((payload as { data?: T }).data ?? fallback) as T;
    }

    return (payload as T) ?? fallback;
}

function getSuggestionColor(type: SeoSuggestion['type']) {
    switch (type) {
        case 'error':
            return 'text-red-500';
        case 'warning':
            return 'text-yellow-500';
        default:
            return 'text-blue-400';
    }
}

function getSuggestionIcon(type: SeoSuggestion['type']) {
    switch (type) {
        case 'error':
            return 'error';
        case 'warning':
            return 'warning';
        default:
            return 'info';
    }
}

function SeoSkeleton() {
    return (
        <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="theme-panel rounded-2xl p-4">
                        <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
                        <Skeleton className="mb-2 h-3 w-24" />
                        <Skeleton className="h-6 w-28" />
                    </div>
                ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-xl border border-border-dark bg-surface-dark p-6">
                    <Skeleton className="mb-3 h-6 w-40" />
                    <Skeleton className="mb-8 h-4 w-64" />
                    <div className="space-y-4">
                        {Array.from({ length: 4 }, (_, index) => (
                            <Skeleton key={index} className="h-20 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
                <div className="rounded-xl border border-border-dark bg-surface-dark p-6">
                    <Skeleton className="mb-3 h-6 w-32" />
                    <div className="space-y-3">
                        {Array.from({ length: 5 }, (_, index) => (
                            <Skeleton key={index} className="h-10 w-full rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SeoPage() {
    const [dashboard, setDashboard] = useState<SeoDashboardPayload>(emptyDashboard);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedPageIndex, setSelectedPageIndex] = useState(0);
    const [keywordInput, setKeywordInput] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let isMounted = true;

        const fetchDashboard = async () => {
            try {
                setLoading(true);
                setErrorMessage('');
                const payload = await apiClient.get<unknown>('/api/v1/seo');
                const resolved = resolveData<SeoDashboardPayload>(payload, emptyDashboard);

                if (!isMounted) {
                    return;
                }

                setDashboard(resolved);
            } catch {
                if (!isMounted) {
                    return;
                }

                setDashboard(emptyDashboard);
                setErrorMessage('Khong the tai SEO dashboard, dang hien thi du lieu rong.');
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

    const selectedPage = useMemo(
        () => dashboard.pages[selectedPageIndex] || dashboard.homepage,
        [dashboard.homepage, dashboard.pages, selectedPageIndex]
    );

    const updateHomepageField = <K extends keyof SeoPageRecord>(
        field: K,
        value: SeoPageRecord[K]
    ) => {
        setDashboard((previous) => ({
            ...previous,
            homepage: {
                ...previous.homepage,
                [field]: value,
            },
        }));
    };

    const updateGlobalField = <K extends keyof SeoGlobalSettings>(
        field: K,
        value: SeoGlobalSettings[K]
    ) => {
        setDashboard((previous) => ({
            ...previous,
            globalSettings: {
                ...previous.globalSettings,
                [field]: value,
            },
        }));
    };

    const handleAddKeyword = () => {
        const nextKeyword = keywordInput.trim();

        if (!nextKeyword) {
            return;
        }

        if (dashboard.homepage.focusKeywords.includes(nextKeyword)) {
            setKeywordInput('');
            return;
        }

        updateHomepageField('focusKeywords', [...dashboard.homepage.focusKeywords, nextKeyword]);
        setKeywordInput('');
    };

    const handleRemoveKeyword = (keyword: string) => {
        updateHomepageField(
            'focusKeywords',
            dashboard.homepage.focusKeywords.filter((item) => item !== keyword)
        );
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = await apiClient.put<unknown>('/api/v1/seo', {
                globalSettings: dashboard.globalSettings,
                homepage: {
                    metaTitle: dashboard.homepage.metaTitle,
                    metaDescription: dashboard.homepage.metaDescription,
                    canonicalUrl: dashboard.homepage.canonicalUrl,
                    focusKeywords: dashboard.homepage.focusKeywords,
                    ogImage: dashboard.homepage.ogImage,
                    noIndex: dashboard.homepage.noIndex,
                    noFollow: dashboard.homepage.noFollow,
                },
            });
            const resolved = resolveData<SeoDashboardPayload>(payload, dashboard);
            setDashboard(resolved);
            toast.success('Da luu SEO settings');
        } catch {
            toast.error('Khong the luu SEO settings luc nay');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <SeoSkeleton />;
    }

    return (
        <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
            {errorMessage ? (
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-xs text-yellow-300">
                    {errorMessage}
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SeoStatCard icon="score" label="Overall Health Score" value={`${dashboard.overview.healthScore}/100`} color="text-purple-400" />
                <SeoStatCard icon="trending_up" label="Organic Traffic" value={dashboard.overview.organicTrafficChange} color="text-green-400" />
                <SeoStatCard icon="link" label="Indexed Pages" value={String(dashboard.overview.indexedPages)} color="text-primary" />
                <SeoStatCard icon="warning" label="Critical Issues" value={String(dashboard.overview.criticalIssues)} color="text-yellow-400" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="flex flex-col gap-6 lg:col-span-2">
                    <div className="theme-panel overflow-hidden rounded-2xl shadow-sm">
                        <div className="theme-border flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="flex items-center gap-2 text-lg font-bold text-[color:var(--text-main-theme)]">
                                    <span className="material-symbols-outlined text-primary">edit_document</span>
                                    Homepage SEO
                                </h3>
                                <p className="theme-muted mt-1 text-xs">
                                    Chinh phan SEO toan cuc cho trang chu va cac cai dat lien quan den indexing.
                                </p>
                            </div>
                            <button
                                onClick={() => void handleSave()}
                                disabled={saving}
                                className="theme-glow-button inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[18px]">{saving ? 'sync' : 'save'}</span>
                                {saving ? 'Dang luu...' : 'Save Changes'}
                            </button>
                        </div>

                        <div className="space-y-6 p-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <Field
                                        label="Page Title"
                                        value={dashboard.homepage.metaTitle}
                                        onChange={(value) => updateHomepageField('metaTitle', value)}
                                        helper={`${dashboard.homepage.metaTitle.length}/60`}
                                    />
                                    <Field
                                        label="Canonical URL"
                                        value={dashboard.homepage.canonicalUrl}
                                        onChange={(value) => updateHomepageField('canonicalUrl', value)}
                                    />
                                    <Field
                                        label="OG Image"
                                        value={dashboard.homepage.ogImage}
                                        onChange={(value) => updateHomepageField('ogImage', value)}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="theme-muted mb-1 block text-sm font-medium">
                                            Meta Description
                                        </label>
                                        <textarea
                                            value={dashboard.homepage.metaDescription}
                                            onChange={(event) => updateHomepageField('metaDescription', event.target.value)}
                                            rows={4}
                                            className="theme-input w-full resize-none rounded-2xl px-3 py-2 text-sm"
                                        />
                                        <div className="mt-1 flex justify-end">
                                            <span className="theme-muted text-xs">
                                                {dashboard.homepage.metaDescription.length}/160
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-[#9dabb9]">
                                            Focus Keywords
                                        </label>
                                        <div className="theme-input min-h-[42px] rounded-2xl p-2">
                                            <div className="mb-2 flex flex-wrap gap-2">
                                                {dashboard.homepage.focusKeywords.map((keyword) => (
                                                    <span key={keyword} className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                                                        {keyword}
                                                        <button onClick={() => handleRemoveKeyword(keyword)}>x</button>
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                value={keywordInput}
                                                onChange={(event) => setKeywordInput(event.target.value)}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        event.preventDefault();
                                                        handleAddKeyword();
                                                    }
                                                }}
                                                placeholder="Add keyword..."
                                                className="w-full border-none bg-transparent p-0 text-sm text-[color:var(--text-main-theme)] focus:ring-0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="theme-border border-t pt-6">
                                <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-[color:var(--text-main-theme)]">
                                    <span className="material-symbols-outlined text-lg text-[#9dabb9]">preview</span>
                                    Search Preview
                                </h4>
                                <div className="theme-panel-muted theme-border max-w-2xl rounded-2xl border p-4">
                                    <div className="mb-1 text-xs font-mono text-[#0bda5b]">
                                        {dashboard.homepage.canonicalUrl || 'https://dailydevops.blog/'}
                                    </div>
                                    <h3 className="mb-1 text-xl font-medium text-[#8ab4f8]">
                                        {dashboard.homepage.metaTitle || 'DevOps Blog'}
                                    </h3>
                                    <p className="theme-muted text-sm leading-snug">
                                        {dashboard.homepage.metaDescription || 'No meta description configured yet.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="theme-panel overflow-hidden rounded-2xl shadow-sm">
                        <div className="theme-border border-b p-4">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-[color:var(--text-main-theme)]">
                                <span className="material-symbols-outlined text-yellow-500">lightbulb</span>
                                Suggestions & Improvements
                            </h3>
                        </div>
                        <div className="divide-y divide-border-dark">
                            {dashboard.suggestions.length === 0 ? (
                                <div className="theme-muted p-4 text-sm">Khong co canh bao SEO nghiem trong nao luc nay.</div>
                            ) : (
                                dashboard.suggestions.map((suggestion, index) => (
                                    <div key={`${suggestion.title}-${index}`} className="flex items-start gap-3 p-4 transition-colors hover:bg-[color:var(--surface-muted)]">
                                        <span className={`material-symbols-outlined mt-0.5 ${getSuggestionColor(suggestion.type)}`}>
                                            {getSuggestionIcon(suggestion.type)}
                                        </span>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-[color:var(--text-main-theme)]">{suggestion.title}</h4>
                                            <p className="theme-muted mt-1 text-xs">{suggestion.description}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="theme-panel overflow-hidden rounded-2xl shadow-sm">
                        <div className="theme-border border-b p-4">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-[color:var(--text-main-theme)]">
                                <span className="material-symbols-outlined text-[#9dabb9]">settings</span>
                                Global Settings
                            </h3>
                        </div>
                        <div className="space-y-4 p-4">
                            <ToggleRow
                                title="Search Indexing"
                                description="Cho phep search engine index website."
                                checked={dashboard.globalSettings.searchIndexing}
                                onChange={(checked) => updateGlobalField('searchIndexing', checked)}
                            />
                            <Field
                                label="Homepage Title Suffix"
                                value={dashboard.globalSettings.homepageTitleSuffix}
                                onChange={(value) => updateGlobalField('homepageTitleSuffix', value)}
                            />
                            <div>
                                <label className="mb-1 block text-sm font-medium text-[#9dabb9]">Robots.txt Content</label>
                                <textarea
                                    value={dashboard.globalSettings.robotsTxt}
                                    onChange={(event) => updateGlobalField('robotsTxt', event.target.value)}
                                    rows={4}
                                    className="w-full resize-none rounded-lg border border-border-dark bg-[#283039] px-3 py-2 font-mono text-xs text-[#9dabb9] focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <Field
                                label="Google Analytics ID"
                                value={dashboard.globalSettings.analyticsId}
                                onChange={(value) => updateGlobalField('analyticsId', value)}
                                placeholder="G-XXXXXXXXXX"
                            />
                        </div>
                    </div>

                    <div className="theme-panel overflow-hidden rounded-2xl shadow-sm">
                        <div className="theme-border border-b p-4">
                            <h3 className="text-lg font-bold text-[color:var(--text-main-theme)]">Page Audit</h3>
                            <p className="theme-muted mt-1 text-xs">Danh sach page va bai viet da duoc index trong dashboard.</p>
                        </div>
                        <div className="max-h-[360px] overflow-y-auto p-2">
                            {dashboard.pages.map((page, index) => (
                                <button
                                    key={`${page.slug}-${index}`}
                                    onClick={() => setSelectedPageIndex(index)}
                                    className={`w-full rounded-2xl px-3 py-3 text-left transition-colors ${selectedPageIndex === index ? 'bg-primary/10' : 'hover:bg-[color:var(--surface-muted)]'}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="mb-1 truncate font-mono text-xs text-[#0bda5b]">
                                                {page.slug}
                                            </p>
                                            <h4 className="line-clamp-1 text-sm font-medium text-[#8ab4f8]">
                                                {page.title}
                                            </h4>
                                            <p className="theme-muted line-clamp-2 text-xs">
                                                {page.metaDescription || 'No description'}
                                            </p>
                                        </div>
                                        <span className={`font-mono text-sm font-bold ${page.score && page.score >= 90 ? 'text-green-400' : page.score && page.score >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {page.score || 0}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="theme-panel overflow-hidden rounded-2xl shadow-sm">
                        <div className="theme-border border-b p-4">
                            <h3 className="text-lg font-bold text-[color:var(--text-main-theme)]">Top Performing Keywords</h3>
                        </div>
                        <div className="space-y-4 p-4">
                            {dashboard.topKeywords.length === 0 ? (
                                <p className="theme-muted text-sm">Chua co du lieu tu khoa noi bat.</p>
                            ) : (
                                dashboard.topKeywords.map((keyword) => (
                                    <div key={keyword.term}>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[color:var(--text-main-theme)]">{keyword.term}</span>
                                            <span className="font-mono font-bold text-green-500">#{keyword.position}</span>
                                        </div>
                                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--surface-strong)]">
                                            <div
                                                className="h-full rounded-full bg-primary"
                                                style={{ width: `${Math.min(100, keyword.mentions * 20)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="theme-panel rounded-2xl p-4">
                <h3 className="mb-2 text-sm font-bold text-[color:var(--text-main-theme)]">Selected Page Snapshot</h3>
                <p className="theme-muted text-xs">
                    <span className="font-mono text-[#0bda5b]">{selectedPage.slug}</span>
                    {' - '}
                    {selectedPage.issues?.length
                        ? `${selectedPage.issues.length} issue(s): ${selectedPage.issues.join(', ')}`
                        : 'Trang nay dang co cau hinh SEO tot.'}
                </p>
            </div>
        </div>
    );
}

function SeoStatCard({
    icon,
    label,
    value,
    color,
}: {
    icon: string;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div className="theme-panel flex items-center gap-4 rounded-2xl p-4">
            <div className={`flex size-10 items-center justify-center rounded-lg bg-white/5 ${color}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div>
                <p className="theme-muted text-xs font-medium uppercase">{label}</p>
                <h3 className="text-xl font-bold text-[color:var(--text-main-theme)]">{value}</h3>
            </div>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    helper,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    helper?: string;
    placeholder?: string;
}) {
    return (
        <div>
            <label className="theme-muted mb-1 block text-sm font-medium">{label}</label>
            <div className="relative">
                <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className="theme-input w-full rounded-2xl px-3 py-2 text-sm"
                />
                {helper ? (
                    <span className="theme-muted absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold">
                        {helper}
                    </span>
                ) : null}
            </div>
        </div>
    );
}

function ToggleRow({
    title,
    description,
    checked,
    onChange,
}: {
    title: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-[color:var(--text-main-theme)]">{title}</p>
                <p className="theme-muted text-xs">{description}</p>
            </div>
            <div className="relative">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => onChange(event.target.checked)}
                    className="peer sr-only"
                    id={title}
                />
                <label
                    htmlFor={title}
                    className="block h-6 w-11 cursor-pointer rounded-full bg-[color:var(--surface-strong)] transition-colors after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full"
                />
            </div>
        </div>
    );
}
