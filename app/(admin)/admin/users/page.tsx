'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';
import { formatDate, formatRelativeTime, getImageUrl } from '@/lib/utils';
import { Skeleton } from '@/components/shared/skeleton';
import toast from 'react-hot-toast';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    role: string;
    isActive: boolean;
    lastLoginAt?: string;
    createdAt: string;
    _count?: { posts: number; comments: number };
}

interface PaginatedUsers {
    data: User[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const roles = [
    { key: 'ADMIN', label: 'Administrator', desc: 'Full system access, user management, settings', icon: 'shield', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { key: 'MODERATOR', label: 'Moderator', desc: 'Manage comments, review content, moderation', icon: 'gavel', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { key: 'EDITOR', label: 'Editor', desc: 'Create, edit and publish technical articles', icon: 'edit_note', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { key: 'AUTHOR', label: 'Author', desc: 'Draft and submit articles for editorial review', icon: 'stylus_note', color: 'text-violet-300', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    { key: 'VIEWER', label: 'Viewer', desc: 'Read-only access to dashboard and reports', icon: 'visibility', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
];

function resolvePayload(payload: unknown): PaginatedUsers {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        const nestedData = (payload as { data?: unknown }).data;

        if (nestedData && typeof nestedData === 'object' && 'data' in nestedData) {
            return nestedData as PaginatedUsers;
        }
    }

    return (payload as PaginatedUsers) ?? { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } };
}

function getRoleBadge(role: string) {
    const roleConfig = roles.find((item) => item.key === role);

    if (!roleConfig) {
        return {
            key: role,
            label: role,
            desc: role,
            icon: 'person',
            color: 'text-gray-400',
            bg: 'bg-gray-500/10',
            border: 'border-gray-500/20',
        };
    }

    return roleConfig;
}

function getUserName(user: User) {
    return `${user.firstName} ${user.lastName}`.trim();
}

function getInitials(user: User) {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` || 'US';
}

function RoleCardSkeleton() {
    return (
        <div className="rounded-xl border border-border-dark bg-surface-dark p-5">
            <Skeleton className="mb-4 h-10 w-10 rounded-lg" />
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="mt-4 h-3 w-20" />
        </div>
    );
}

function UsersTableSkeleton() {
    return (
        <div className="space-y-3 p-4">
            {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="grid grid-cols-[2.2fr_1.2fr_1fr_1fr_1fr_1fr_auto] gap-3 rounded-xl border border-border-dark bg-[#111418] p-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-44" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <div className="flex justify-end">
                        <Skeleton className="h-8 w-20" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    const fetchUsers = useCallback(async (showRefreshing = false) => {
        try {
            if (showRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setErrorMessage('');

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '12',
                ...(searchQuery && { search: searchQuery }),
                ...(roleFilter && { role: roleFilter }),
            });

            const response = await apiClient.get<unknown>(`/api/v1/users?${params}`);
            const resolved = resolvePayload(response);

            setUsers(resolved.data || []);
            setTotalPages(resolved.meta?.totalPages || 1);
            setTotalUsers(resolved.meta?.total || 0);
        } catch {
            setUsers([]);
            setTotalPages(1);
            setTotalUsers(0);
            setErrorMessage('Khong the tai danh sach nguoi dung luc nay.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, roleFilter, searchQuery]);

    useEffect(() => {
        void fetchUsers();
    }, [fetchUsers]);

    const roleStats = useMemo(() => {
        const counts = users.reduce<Record<string, number>>((accumulator, user) => {
            accumulator[user.role] = (accumulator[user.role] || 0) + 1;
            return accumulator;
        }, {});

        return roles.map((role) => ({
            ...role,
            count: counts[role.key] || 0,
        }));
    }, [users]);

    const handleSearchSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setCurrentPage(1);
        setSearchQuery(searchInput.trim());
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await apiClient.put(`/api/v1/users/${userId}`, { role: newRole });
            toast.success('Da cap nhat vai tro nguoi dung');
            void fetchUsers(true);
        } catch {
            toast.error('Khong the cap nhat vai tro');
        }
    };

    const handleStatusToggle = async (user: User) => {
        try {
            await apiClient.put(`/api/v1/users/${user.id}`, { isActive: !user.isActive });
            toast.success(user.isActive ? 'Da khoa tai khoan' : 'Da kich hoat tai khoan');
            void fetchUsers(true);
        } catch {
            toast.error('Khong the cap nhat trang thai tai khoan');
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Ban co chac muon xoa nguoi dung nay vinh vien khong?')) {
            return;
        }

        try {
            await apiClient.delete(`/api/v1/users/${userId}`);
            toast.success('Da xoa nguoi dung');
            void fetchUsers(true);
        } catch {
            toast.error('Khong the xoa nguoi dung');
        }
    };

    return (
        <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[color:var(--text-main-theme)]">Users & Roles</h1>
                    <p className="theme-muted mt-1 text-sm">
                        Quan ly truy cap, vai tro va tinh trang hoat dong cua nguoi dung.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => void fetchUsers(true)}
                        className="theme-panel-muted theme-border inline-flex h-10 items-center gap-2 rounded-2xl border px-4 text-sm font-medium text-[color:var(--text-main-theme)] transition-colors hover:opacity-90"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
                        Lam moi
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {loading ? (
                    Array.from({ length: 4 }, (_, index) => <RoleCardSkeleton key={index} />)
                ) : (
                    roleStats.map((role) => (
                        <button
                            key={role.key}
                            onClick={() => {
                                setRoleFilter(roleFilter === role.key ? '' : role.key);
                                setCurrentPage(1);
                            }}
                            className={`relative flex flex-col gap-3 overflow-hidden rounded-xl border p-5 text-left transition-all hover:shadow-lg ${
                                roleFilter === role.key
                                    ? `${role.border} ${role.bg} ring-1 ring-current ${role.color}`
                                    : 'theme-panel hover:border-primary/30'
                            }`}
                        >
                            <div className={`absolute left-0 top-0 h-full w-1 ${role.bg.replace('/10', '')}`} />
                            <div className={`flex size-10 items-center justify-center rounded-lg ${role.bg} ${role.color}`}>
                                <span className="material-symbols-outlined">{role.icon}</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[color:var(--text-main-theme)]">{role.label}</h3>
                                <p className="theme-muted mt-1 text-xs">{role.desc}</p>
                            </div>
                            <div className="theme-border mt-2 flex items-center justify-between border-t pt-3 text-xs">
                                <span className="theme-muted">Trong trang hien tai</span>
                                <span className="font-mono text-[color:var(--text-main-theme)]">{role.count}</span>
                            </div>
                        </button>
                    ))
                )}
            </div>

            <div className="theme-panel overflow-hidden rounded-2xl">
                <div className="theme-border flex flex-col gap-4 border-b p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-base font-bold text-[color:var(--text-main-theme)]">
                            Danh sach nguoi dung
                            {roleFilter ? (
                                <span className="ml-2 text-sm font-normal text-primary">- {roleFilter}</span>
                            ) : null}
                        </h3>
                        <p className="theme-muted mt-1 text-xs">
                            {loading ? 'Dang tai...' : `${totalUsers} tai khoan phu hop bo loc hien tai`}
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
                            <span className="material-symbols-outlined theme-muted absolute left-3 top-2.5 text-[18px]">search</span>
                            <input
                                className="theme-input w-full rounded-2xl py-2 pl-9 pr-3 text-sm"
                                placeholder="Tim theo ten hoac email..."
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                            />
                        </form>
                        <select
                            value={roleFilter}
                            onChange={(event) => {
                                setRoleFilter(event.target.value);
                                setCurrentPage(1);
                            }}
                            className="theme-input cursor-pointer rounded-2xl px-4 py-2 text-sm"
                        >
                            <option value="">Tat ca vai tro</option>
                            {roles.map((role) => (
                                <option key={role.key} value={role.key}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <UsersTableSkeleton />
                    ) : errorMessage ? (
                        <div className="theme-muted p-16 text-center">
                            <span className="material-symbols-outlined mb-2 block text-4xl text-[#fa6238]">warning</span>
                            {errorMessage}
                        </div>
                    ) : users.length === 0 ? (
                        <div className="theme-muted p-16 text-center">
                            <span className="material-symbols-outlined mb-2 block text-4xl">manage_accounts</span>
                            Khong tim thay nguoi dung nao.
                        </div>
                    ) : (
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="theme-border bg-[color:var(--surface-muted)] text-xs font-medium uppercase theme-muted border-b">
                                    <th className="p-4">User</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Posts</th>
                                    <th className="p-4">Last Active</th>
                                    <th className="p-4">Joined</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y theme-border">
                                {users.map((user) => {
                                    const roleDef = getRoleBadge(user.role);

                                    return (
                                        <tr key={user.id} className="group transition-colors hover:bg-[color:var(--surface-muted)]">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-sm font-bold text-primary ring-2 ring-[#283039]">
                                                        {user.avatar ? (
                                                            <img
                                                                src={getImageUrl(user.avatar)}
                                                                alt={getUserName(user)}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            getInitials(user)
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-[color:var(--text-main-theme)]">
                                                            {getUserName(user)}
                                                        </span>
                                                        <span className="theme-muted text-xs">{user.email}</span>
                                                        {user.bio ? (
                                                            <span className="theme-soft mt-1 line-clamp-1 text-xs">
                                                                {user.bio}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <select
                                                    value={user.role}
                                                    onChange={(event) => void handleRoleChange(user.id, event.target.value)}
                                                    className={`rounded border px-2 py-1 text-xs font-bold focus:ring-1 focus:ring-primary ${roleDef.bg} ${roleDef.color} ${roleDef.border}`}
                                                >
                                                    {roles.map((role) => (
                                                        <option key={role.key} value={role.key} className="bg-white text-slate-900 dark:bg-[#111418] dark:text-white">
                                                            {role.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => void handleStatusToggle(user)}
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold transition-colors ${
                                                        user.isActive
                                                            ? 'border-green-500/20 bg-green-500/10 text-green-400'
                                                            : 'border-gray-500/20 bg-gray-500/10 text-gray-400'
                                                    }`}
                                                >
                                                    <span className={`size-1.5 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-mono text-sm text-[color:var(--text-main-theme)]">{user._count?.posts || 0}</div>
                                                <div className="theme-muted text-xs">{user._count?.comments || 0} comments</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="theme-muted text-sm">
                                                    {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : '--'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="theme-muted text-sm">{formatDate(user.createdAt)}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-60 transition-opacity group-hover:opacity-100">
                                                    <button
                                                        onClick={() => void handleDelete(user.id)}
                                                        className="theme-muted rounded-lg p-1.5 transition-colors hover:bg-red-500/10 hover:text-red-500"
                                                        title="Delete user"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {totalPages > 1 ? (
                    <div className="theme-border flex items-center justify-between border-t p-4">
                        <span className="theme-muted text-xs">
                            Trang {currentPage}/{totalPages} - {totalUsers} nguoi dung
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="theme-panel-muted theme-border rounded border px-3 py-1 text-xs theme-muted transition-colors hover:text-[color:var(--text-main-theme)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="theme-panel-muted theme-border rounded border px-3 py-1 text-xs theme-muted transition-colors hover:text-[color:var(--text-main-theme)] disabled:cursor-not-allowed disabled:opacity-50"
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
