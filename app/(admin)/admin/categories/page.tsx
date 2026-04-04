'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import type { Category } from '@/types';
import toast from 'react-hot-toast';

type CategoriesPayload = { data?: Category[] } | Category[];

interface CategoryFormState {
    name: string;
    slug: string;
    description: string;
    color: string;
    icon: string;
}

const initialFormState: CategoryFormState = {
    name: '',
    slug: '',
    description: '',
    color: '',
    icon: '',
};

function resolveCategories(payload: CategoriesPayload): Category[] {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && typeof payload === 'object' && 'data' in payload) {
        return Array.isArray(payload.data) ? payload.data : [];
    }

    return [];
}

export default function CategoriesAdminPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formState, setFormState] = useState<CategoryFormState>(initialFormState);

    const fetchCategories = async () => {
        const payload = await apiClient.get<CategoriesPayload>('/api/v1/categories');
        setCategories(resolveCategories(payload));
    };

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            try {
                setLoading(true);
                await fetchCategories();
            } catch {
                if (isMounted) {
                    toast.error('Khong the tai danh sach category');
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
            toast.error('Ten category la bat buoc');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                name: formState.name.trim(),
                slug: formState.slug.trim() || null,
                description: formState.description.trim() || null,
                color: formState.color.trim() || null,
                icon: formState.icon.trim() || null,
            };

            if (editingId) {
                await apiClient.put(`/api/v1/categories/${editingId}`, payload);
                toast.success('Da cap nhat category');
            } else {
                await apiClient.post('/api/v1/categories', payload);
                toast.success('Da tao category moi');
            }

            await fetchCategories();
            resetForm();
        } catch {
            toast.error(editingId ? 'Khong the cap nhat category' : 'Khong the tao category');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingId(category.id);
        setFormState({
            name: category.name || '',
            slug: category.slug || '',
            description: category.description || '',
            color: category.color || '',
            icon: category.icon || '',
        });
    };

    const handleDelete = async (category: Category) => {
        if (!window.confirm(`Xoa category "${category.name}"?`)) {
            return;
        }

        try {
            await apiClient.delete(`/api/v1/categories/${category.id}`);
            toast.success('Da xoa category');
            await fetchCategories();

            if (editingId === category.id) {
                resetForm();
            }
        } catch {
            toast.error('Khong the xoa category nay');
        }
    };

    return (
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-[color:var(--text-main-theme)]">Categories</h1>
                <p className="theme-muted text-sm">
                    Quan ly taxonomy cho trang chu, bo loc bai viet va luong bien tap.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
                <section className="theme-panel rounded-2xl p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-[color:var(--text-main-theme)]">
                                {editingId ? 'Sua category' : 'Them category'}
                            </h2>
                            <p className="theme-muted mt-1 text-sm">
                                Them nhanh category moi hoac cap nhat category dang co.
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
                                placeholder="Automation"
                            />
                        </div>
                        <div>
                            <label className="theme-muted mb-1.5 block text-xs font-medium">Slug</label>
                            <input
                                value={formState.slug}
                                onChange={(event) => setFormState((prev) => ({ ...prev, slug: event.target.value }))}
                                className="theme-input w-full rounded-2xl px-3 py-2 text-sm"
                                placeholder="automation"
                            />
                        </div>
                        <div>
                            <label className="theme-muted mb-1.5 block text-xs font-medium">Mo ta</label>
                            <textarea
                                value={formState.description}
                                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                                rows={4}
                                className="theme-input w-full resize-none rounded-2xl px-3 py-2 text-sm"
                                placeholder="Mo ta ngan cho category nay..."
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="theme-muted mb-1.5 block text-xs font-medium">Color</label>
                                <input
                                    value={formState.color}
                                    onChange={(event) => setFormState((prev) => ({ ...prev, color: event.target.value }))}
                                    className="theme-input w-full rounded-2xl px-3 py-2 text-sm"
                                    placeholder="#0ea5e9"
                                />
                            </div>
                            <div>
                                <label className="theme-muted mb-1.5 block text-xs font-medium">Icon</label>
                                <input
                                    value={formState.icon}
                                    onChange={(event) => setFormState((prev) => ({ ...prev, icon: event.target.value }))}
                                    className="theme-input w-full rounded-2xl px-3 py-2 text-sm"
                                    placeholder="bolt"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="theme-glow-button inline-flex h-10 items-center rounded-2xl px-4 text-sm font-bold disabled:opacity-50"
                        >
                            {submitting ? 'Dang luu...' : editingId ? 'Cap nhat category' : 'Tao category'}
                        </button>
                    </form>
                </section>

                <section className="theme-panel rounded-2xl p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-[color:var(--text-main-theme)]">Danh sach category</h2>
                            <p className="theme-muted mt-1 text-sm">
                                Category duoc hien thi o homepage va trang category.
                            </p>
                        </div>
                        <span className="theme-muted text-xs">{categories.length} category</span>
                    </div>

                    {loading ? (
                        <div className="theme-panel-muted rounded-2xl p-4 text-sm theme-muted">
                            Dang tai category...
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="theme-panel-muted rounded-2xl p-4 text-sm theme-muted">
                            Chua co category nao.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {categories.map((category) => (
                                <article
                                    key={category.id}
                                    className="theme-panel-muted theme-border rounded-2xl border p-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="inline-flex size-3 rounded-full border border-white/20"
                                                    style={{ backgroundColor: category.color || '#3b82f6' }}
                                                />
                                                <h3 className="truncate text-sm font-bold text-[color:var(--text-main-theme)]">
                                                    {category.name}
                                                </h3>
                                            </div>
                                            <p className="theme-muted mt-2 text-xs font-mono">
                                                /category/{category.slug}
                                            </p>
                                            <p className="theme-muted mt-3 text-sm">
                                                {category.description || 'Chua co mo ta cho category nay.'}
                                            </p>
                                            <div className="theme-muted mt-3 flex items-center gap-3 text-xs">
                                                <span>{category._count?.posts || 0} bai viet</span>
                                                {category.icon ? <span>icon: {category.icon}</span> : null}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(category)}
                                                className="theme-muted text-sm hover:text-primary"
                                            >
                                                Sua
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void handleDelete(category)}
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
