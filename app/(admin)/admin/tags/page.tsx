'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import type { Tag } from '@/types';
import toast from 'react-hot-toast';

type TagsPayload = { data?: Tag[] } | Tag[];

interface TagFormState {
    name: string;
    slug: string;
}

const initialFormState: TagFormState = {
    name: '',
    slug: '',
};

function resolveTags(payload: TagsPayload): Tag[] {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && typeof payload === 'object' && 'data' in payload) {
        return Array.isArray(payload.data) ? payload.data : [];
    }

    return [];
}

export default function TagsAdminPage() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formState, setFormState] = useState<TagFormState>(initialFormState);

    const fetchTags = async () => {
        const payload = await apiClient.get<TagsPayload>('/api/v1/tags');
        setTags(resolveTags(payload));
    };

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            try {
                setLoading(true);
                await fetchTags();
            } catch {
                if (isMounted) {
                    toast.error('Khong the tai danh sach tag');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            isMounted = false;
        };
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setFormState(initialFormState);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!formState.name.trim()) {
            toast.error('Ten tag la bat buoc');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                name: formState.name.trim(),
                slug: formState.slug.trim() || null,
            };

            if (editingId) {
                await apiClient.put(`/api/v1/tags/${editingId}`, payload);
                toast.success('Da cap nhat tag');
            } else {
                await apiClient.post('/api/v1/tags', payload);
                toast.success('Da tao tag moi');
            }

            await fetchTags();
            resetForm();
        } catch {
            toast.error(editingId ? 'Khong the cap nhat tag' : 'Khong the tao tag');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (tag: Tag) => {
        setEditingId(tag.id);
        setFormState({
            name: tag.name || '',
            slug: tag.slug || '',
        });
    };

    const handleDelete = async (tag: Tag) => {
        if (!window.confirm(`Xoa tag "${tag.name}"?`)) {
            return;
        }

        try {
            await apiClient.delete(`/api/v1/tags/${tag.id}`);
            toast.success('Da xoa tag');
            await fetchTags();

            if (editingId === tag.id) {
                resetForm();
            }
        } catch {
            toast.error('Khong the xoa tag nay');
        }
    };

    return (
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-[color:var(--text-main-theme)]">Tags</h1>
                <p className="theme-muted text-sm">
                    Quan ly nhan bai viet de ho tro bo loc, tim kiem va related content.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                <section className="theme-panel rounded-2xl p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-[color:var(--text-main-theme)]">
                                {editingId ? 'Sua tag' : 'Them tag'}
                            </h2>
                            <p className="theme-muted mt-1 text-sm">
                                Tao tag moi de gan nhanh trong luc soan bai.
                            </p>
                        </div>
                        {editingId ? (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="theme-muted text-sm hover:text-[color:var(--text-main-theme)]"
                            >
                                Huy
                            </button>
                        ) : null}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="theme-muted mb-1.5 block text-xs font-medium">Ten</label>
                            <input
                                value={formState.name}
                                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                                className="theme-input w-full rounded-2xl px-3 py-2 text-sm"
                                placeholder="ansible"
                            />
                        </div>
                        <div>
                            <label className="theme-muted mb-1.5 block text-xs font-medium">Slug</label>
                            <input
                                value={formState.slug}
                                onChange={(event) => setFormState((prev) => ({ ...prev, slug: event.target.value }))}
                                className="theme-input w-full rounded-2xl px-3 py-2 text-sm"
                                placeholder="ansible"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="theme-glow-button inline-flex h-10 items-center rounded-2xl px-4 text-sm font-bold disabled:opacity-50"
                        >
                            {submitting ? 'Dang luu...' : editingId ? 'Cap nhat tag' : 'Tao tag'}
                        </button>
                    </form>
                </section>

                <section className="theme-panel rounded-2xl p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-[color:var(--text-main-theme)]">Danh sach tag</h2>
                            <p className="theme-muted mt-1 text-sm">
                                Tag hien thi o trang tag va duoc dung trong bo loc frontend.
                            </p>
                        </div>
                        <span className="theme-muted text-xs">{tags.length} tag</span>
                    </div>

                    {loading ? (
                        <div className="theme-panel-muted rounded-2xl p-4 text-sm theme-muted">
                            Dang tai tag...
                        </div>
                    ) : tags.length === 0 ? (
                        <div className="theme-panel-muted rounded-2xl p-4 text-sm theme-muted">
                            Chua co tag nao.
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {tags.map((tag) => (
                                <article
                                    key={tag.id}
                                    className="theme-panel-muted theme-border rounded-2xl border p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-bold text-[color:var(--text-main-theme)]">
                                                #{tag.name}
                                            </h3>
                                            <p className="theme-muted mt-2 text-xs font-mono">
                                                /tag/{tag.slug}
                                            </p>
                                            <p className="theme-muted mt-3 text-xs">
                                                {tag._count?.posts || 0} bai viet dang dung tag nay
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(tag)}
                                                className="theme-muted text-sm hover:text-primary"
                                            >
                                                Sua
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void handleDelete(tag)}
                                                className="text-sm text-red-400 hover:text-red-300"
                                            >
                                                Xoa
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
