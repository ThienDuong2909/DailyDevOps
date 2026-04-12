'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAccessToken } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { formatDate, getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

type MediaItem = {
    key: string;
    url: string;
    size: number;
    lastModified?: string | null;
    folder?: 'post-media' | 'featured-images' | 'avatars' | 'seo' | 'newsletter' | 'all';
};

type MediaPayload = { data?: MediaItem[] } | MediaItem[];
type MediaFilter = 'all' | 'featured-images' | 'post-media' | 'avatars' | 'seo' | 'newsletter';

const filterOptions: Array<{ value: MediaFilter; label: string }> = [
    { value: 'all', label: 'All Assets' },
    { value: 'featured-images', label: 'Featured' },
    { value: 'post-media', label: 'Post Media' },
    { value: 'avatars', label: 'Avatars' },
    { value: 'seo', label: 'SEO' },
    { value: 'newsletter', label: 'Newsletter' },
];

const MIN_GRID_COLUMNS = 5;
const MAX_GRID_COLUMNS = 10;
const DEFAULT_GRID_COLUMNS = 6;

function resolveData<T>(payload: T | { data?: T }, fallback: T): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return (payload.data ?? fallback) as T;
    }

    return (payload as T) ?? fallback;
}

function formatBytes(size: number) {
    if (size < 1024) {
        return `${size} B`;
    }

    const units = ['KB', 'MB', 'GB'];
    let value = size / 1024;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}

function getExtension(item: MediaItem) {
    const fileName = item.key.split('/').pop() || '';
    return fileName.split('.').pop()?.toLowerCase() || '';
}

function getTypeLabel(folder: string | undefined) {
    switch (folder) {
        case 'featured-images':
            return 'Featured Image';
        case 'post-media':
            return 'Post Media';
        case 'avatars':
            return 'Avatar';
        case 'seo':
            return 'SEO Asset';
        case 'newsletter':
            return 'Newsletter Asset';
        default:
            return 'Image Asset';
    }
}

export default function AdminMediaPage() {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deletingKey, setDeletingKey] = useState('');
    const [query, setQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<MediaFilter>('all');
    const [selectedKey, setSelectedKey] = useState('');
    const [gridColumns, setGridColumns] = useState(DEFAULT_GRID_COLUMNS);
    const galleryRef = useRef<HTMLDivElement | null>(null);

    const fetchMediaLibrary = useCallback(async () => {
        try {
            setLoading(true);
            const payload = await apiClient.get<MediaPayload>('/api/v1/media', {
                params: {
                    folder: activeFilter,
                },
            });
            const resolved = resolveData<MediaItem[]>(payload, []);
            setItems(resolved);
            setSelectedKey((previous) => {
                if (previous && resolved.some((item) => item.key === previous)) {
                    return previous;
                }

                return resolved[0]?.key || '';
            });
        } catch {
            toast.error('Khong the tai media library');
        } finally {
            setLoading(false);
        }
    }, [activeFilter]);

    useEffect(() => {
        void fetchMediaLibrary();
    }, [fetchMediaLibrary]);

    const filteredItems = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return items.filter((item) => !normalizedQuery || item.key.toLowerCase().includes(normalizedQuery));
    }, [items, query]);

    const selectedItem = useMemo(() => {
        if (!filteredItems.length) {
            return null;
        }

        return filteredItems.find((item) => item.key === selectedKey) || filteredItems[0];
    }, [filteredItems, selectedKey]);

    const stats = useMemo(() => {
        const totalSize = items.reduce((sum, item) => sum + item.size, 0);

        return {
            count: items.length,
            totalSize,
            visibleCount: filteredItems.length,
        };
    }, [filteredItems.length, items]);

    const uploadMediaFile = useCallback(async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        let uploadPurpose: string;
        if (activeFilter === 'all') {
            uploadPurpose = 'media';
        } else if (activeFilter === 'featured-images') {
            uploadPurpose = 'featured-image';
        } else {
            uploadPurpose = activeFilter;
        }
        formData.append(
            'purpose',
            uploadPurpose
        );
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

        const response = await fetch(`${apiBase}/api/v1/media/upload`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${getAccessToken() || ''}`,
            },
            credentials: 'include',
            body: formData,
        });

        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload?.message || 'Image upload failed');
        }

        return payload?.data as MediaItem | undefined;
    }, [activeFilter]);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        try {
            setUploading(true);
            const uploaded = await uploadMediaFile(file);
            toast.success('Da upload media goc, giu nguyen dinh dang');
            await fetchMediaLibrary();
            if (uploaded?.key) {
                setSelectedKey(uploaded.key);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Khong the upload media');
        } finally {
            setUploading(false);
        }
    };

    const handleCopy = async (item: MediaItem) => {
        try {
            await navigator.clipboard.writeText(getImageUrl(item.url));
            toast.success('Da copy media URL');
        } catch {
            toast.error('Khong the copy URL');
        }
    };

    const handleDelete = async (item: MediaItem) => {
        if (!window.confirm(`Xoa media ${item.key.split('/').pop()}?`)) {
            return;
        }

        try {
            setDeletingKey(item.key);
            await apiClient.delete('/api/v1/media', {
                data: { key: item.key },
            });
            const remainingItems = items.filter((entry) => entry.key !== item.key);
            setItems(remainingItems);
            setSelectedKey((previous) => {
                if (previous !== item.key) {
                    return previous;
                }

                return remainingItems[0]?.key || '';
            });
            toast.success('Da xoa media');
        } catch {
            toast.error('Khong the xoa media');
        } finally {
            setDeletingKey('');
        }
    };

    useEffect(() => {
        const handleWheel = (event: WheelEvent) => {
            if (!event.ctrlKey || !galleryRef.current) {
                return;
            }

            const target = event.target;
            if (!(target instanceof Node) || !galleryRef.current.contains(target)) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            setGridColumns((current) => {
                if (event.deltaY < 0) {
                    return Math.max(MIN_GRID_COLUMNS, current - 1);
                }

                return Math.min(MAX_GRID_COLUMNS, current + 1);
            });
        };

        document.addEventListener('wheel', handleWheel, {
            passive: false,
            capture: true,
        });

        return () => {
            document.removeEventListener('wheel', handleWheel, {
                capture: true,
            });
        };
    }, []);

    return (
        <div className="theme-surface min-h-[calc(100vh-3rem)] overflow-hidden rounded-[28px]">
            <div className="theme-border border-b bg-[color:color-mix(in_srgb,var(--surface-base)_85%,transparent)] backdrop-blur-xl">
                <div className="flex flex-col gap-5 px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/20">
                            <span className="material-symbols-outlined text-[26px]">perm_media</span>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-blue-300/80">Azure Horizon</p>
                            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[color:var(--text-main-theme)]">Media Library</h1>
                            <p className="theme-muted mt-1 text-sm">
                                Quan ly anh bai viet va asset editor, giu nguyen format goc khi upload.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="theme-input flex h-12 w-full items-center rounded-2xl px-4 sm:w-[360px]">
                            <span className="material-symbols-outlined theme-soft">search</span>
                            <input
                                type="text"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search media key or filename..."
                                className="w-full bg-transparent px-3 text-sm text-[color:var(--text-main-theme)] placeholder-[color:var(--text-soft-theme)] focus:outline-none"
                            />
                        </div>
                        <label className="theme-glow-button inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition hover:opacity-90">
                            <span className="material-symbols-outlined text-[20px]">upload</span>
                            {uploading ? 'Dang upload...' : 'Upload Files'}
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                className="hidden"
                                onChange={(event) => void handleUpload(event)}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                </div>
            </div>

            <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
                <section className="theme-border border-r p-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="theme-panel rounded-3xl p-5">
                            <p className="theme-soft text-[11px] font-bold uppercase tracking-[0.24em]">All Assets</p>
                            <p className="mt-3 text-3xl font-extrabold text-[color:var(--text-main-theme)]">{stats.count}</p>
                        </div>
                        <div className="theme-panel rounded-3xl p-5">
                            <p className="theme-soft text-[11px] font-bold uppercase tracking-[0.24em]">Storage Used</p>
                            <p className="mt-3 text-3xl font-extrabold text-[color:var(--text-main-theme)]">{formatBytes(stats.totalSize)}</p>
                        </div>
                        <div className="theme-panel rounded-3xl p-5">
                            <p className="theme-soft text-[11px] font-bold uppercase tracking-[0.24em]">Search Scope</p>
                            <p className="mt-3 text-3xl font-extrabold text-[color:var(--text-main-theme)]">{stats.visibleCount}</p>
                        </div>
                    </div>

                    <div className="theme-panel mt-6 flex flex-col gap-4 rounded-3xl p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap gap-2">
                                {filterOptions.map((option) => {
                                    const isActive = activeFilter === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setActiveFilter(option.value)}
                                            className={`rounded-full px-4 py-2 text-xs font-bold tracking-tight transition ${
                                                isActive
                                                    ? 'bg-blue-600 text-white'
                                                    : 'theme-panel-muted text-[color:var(--text-muted-theme)] hover:text-[color:var(--text-main-theme)]'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={() => void fetchMediaLibrary()}
                                className="theme-panel-muted theme-border-ghost inline-flex h-11 items-center justify-center rounded-2xl border px-4 text-sm font-semibold text-[color:var(--text-main-theme)] transition hover:border-blue-400/40"
                            >
                                Refresh Library
                            </button>
                        </div>

                        {loading ? (
                            <div className="theme-panel-muted rounded-3xl p-6 text-sm theme-muted">
                                Dang tai media library...
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="rounded-3xl border border-dashed p-8 text-center text-sm theme-muted theme-border-ghost theme-panel-muted">
                                Chua co asset nao khop voi bo loc hien tai.
                            </div>
                        ) : (
                                <div
                                    ref={galleryRef}
                                    className="grid gap-3 transition-all duration-200 ease-out"
                                    style={{
                                        gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                                    }}
                                >
                                {filteredItems.map((item) => {
                                    const isSelected = selectedItem?.key === item.key;
                                    const extension = getExtension(item);

                                    return (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() => setSelectedKey(item.key)}
                                            className={`group overflow-hidden rounded-[12px] border bg-slate-950 text-left transition ${
                                                isSelected
                                                    ? 'border-blue-500/60 ring-2 ring-blue-500/30'
                                                    : 'theme-border-ghost bg-[color:var(--surface-elevated)] hover:border-blue-400/30'
                                            }`}
                                        >
                                            <div className="relative aspect-square overflow-hidden bg-[color:var(--surface-strong)]">
                                                <img
                                                    src={getImageUrl(item.url)}
                                                    alt={item.key}
                                                    className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--surface-elevated)] via-transparent to-transparent opacity-55" />
                                                <span className="absolute right-2 top-2 rounded-full bg-slate-950/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300 backdrop-blur">
                                                    {extension || 'asset'}
                                                </span>
                                                {isSelected ? (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-blue-500/15">
                                                        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-950">
                                                            Selected
                                                        </span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </button>
                                    );
                                })}
                                </div>
                        )}
                    </div>
                </section>

                <aside className="min-h-full bg-[color:color-mix(in_srgb,var(--surface-base)_80%,transparent)] p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-[color:var(--text-main-theme)]">File Details</h2>
                        <span className="theme-border-ghost theme-soft rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em]">
                            Preview
                        </span>
                    </div>

                    {selectedItem ? (
                        <div className="mt-6 space-y-6">
                            <div className="theme-panel overflow-hidden rounded-[24px]">
                                <div className="aspect-square overflow-hidden">
                                    <img
                                        src={getImageUrl(selectedItem.url)}
                                        alt={selectedItem.key}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-400">Filename</p>
                                    <p className="mt-2 break-all text-sm font-bold text-[color:var(--text-main-theme)]">
                                        {selectedItem.key.split('/').pop()}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="theme-soft text-[10px] font-bold uppercase tracking-[0.24em]">Type</p>
                                        <p className="mt-2 text-sm text-[color:var(--text-main-theme)]">
                                            {getTypeLabel(selectedItem.folder)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="theme-soft text-[10px] font-bold uppercase tracking-[0.24em]">Size</p>
                                        <p className="mt-2 text-sm text-[color:var(--text-main-theme)]">{formatBytes(selectedItem.size)}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="theme-soft text-[10px] font-bold uppercase tracking-[0.24em]">Storage Key</p>
                                    <p className="theme-muted mt-2 break-all text-xs">{selectedItem.key}</p>
                                </div>

                                <div>
                                    <p className="theme-soft text-[10px] font-bold uppercase tracking-[0.24em]">Uploaded</p>
                                    <p className="mt-2 text-sm text-[color:var(--text-main-theme)]">
                                        {selectedItem.lastModified ? formatDate(selectedItem.lastModified) : 'Unknown date'}
                                    </p>
                                </div>

                                <div className="theme-panel-muted rounded-3xl p-4">
                                    <p className="theme-soft text-[10px] font-bold uppercase tracking-[0.24em]">
                                        Asset Metadata
                                    </p>
                                    <div className="mt-4 space-y-3">
                                        <div className="theme-muted flex items-center gap-2 text-xs">
                                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                                            Original format preserved
                                        </div>
                                        <div className="theme-muted flex items-center gap-2 text-xs">
                                            <span className="h-2 w-2 rounded-full bg-sky-300" />
                                            Served via internal media proxy
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <button
                                        type="button"
                                        onClick={() => void handleCopy(selectedItem)}
                                        className="theme-panel-muted theme-border-ghost inline-flex h-11 items-center justify-center gap-2 rounded-2xl border text-sm font-bold text-[color:var(--text-main-theme)] transition hover:opacity-90"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                        Copy URL
                                    </button>
                                    <a
                                        href={getImageUrl(selectedItem.url)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="theme-panel-muted theme-border-ghost inline-flex h-11 items-center justify-center gap-2 rounded-2xl border text-sm font-bold text-[color:var(--text-main-theme)] transition hover:opacity-90"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                        Open Original
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => void handleDelete(selectedItem)}
                                        disabled={deletingKey === selectedItem.key}
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 text-sm font-bold text-red-200 transition hover:bg-red-500/15 disabled:opacity-60"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                        {deletingKey === selectedItem.key ? 'Dang xoa...' : 'Delete Asset'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="theme-panel-muted theme-border-ghost mt-6 rounded-[24px] border border-dashed p-6 text-sm theme-muted">
                            Chon mot asset de xem chi tiet.
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

