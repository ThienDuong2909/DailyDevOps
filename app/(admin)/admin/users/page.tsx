'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
    isActive: boolean;
    lastLoginAt?: string;
    createdAt: string;
    _count?: { posts: number; comments: number };
}

const roles = [
    { key: 'ADMIN', label: 'Administrator', desc: 'Full system access, user management, settings', icon: 'shield', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { key: 'MODERATOR', label: 'Moderator', desc: 'Manage comments, review content', icon: 'gavel', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { key: 'EDITOR', label: 'Editor', desc: 'Create, edit and publish articles', icon: 'edit_note', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { key: 'VIEWER', label: 'Viewer', desc: 'Read-only access to dashboard', icon: 'visibility', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
];

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                limit: '20',
                ...(searchQuery && { search: searchQuery }),
                ...(roleFilter && { role: roleFilter }),
            });
            const response = await apiClient.get<{ data?: User[] }>(`/api/v1/users?${params}`);
            const data = response.data as any;
            setUsers(Array.isArray(data) ? data : data?.data || []);
        } catch {
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, [roleFilter]);

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await apiClient.put(`/api/v1/users/${userId}`, { role: newRole });
            toast.success('Role updated');
            fetchUsers();
        } catch {
            toast.error('Failed to update role');
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Delete this user permanently?')) return;
        try {
            await apiClient.delete(`/api/v1/users/${userId}`);
            toast.success('User deleted');
            fetchUsers();
        } catch {
            toast.error('Failed to delete user');
        }
    };

    const getRoleBadge = (role: string) => {
        const r = roles.find(r => r.key === role);
        if (!r) return { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', label: role };
        return r;
    };

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
            {/* Role Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {roles.map((role) => (
                    <div
                        key={role.key}
                        onClick={() => setRoleFilter(roleFilter === role.key ? '' : role.key)}
                        className={`bg-surface-dark border rounded-xl p-5 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-lg ${
                            roleFilter === role.key ? `${role.border} ring-1 ring-current ${role.color}` : 'border-border-dark hover:border-primary/30'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <div className={`size-10 rounded-lg ${role.bg} flex items-center justify-center ${role.color}`}>
                                <span className="material-symbols-outlined">{role.icon}</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">{role.label}</h3>
                            <p className="text-[#9dabb9] text-xs mt-1">{role.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Users Table */}
            <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden">
                <div className="bg-[#111418] border-b border-border-dark p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-white font-bold text-base">
                        User List {roleFilter && <span className="text-primary text-sm font-normal ml-2">— {roleFilter}</span>}
                    </h3>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9dabb9] text-[18px]">search</span>
                            <input
                                className="w-full bg-[#283039] border border-border-dark rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder-[#9dabb9] transition-all"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                            />
                        </div>
                        <button onClick={fetchUsers} className="p-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-[#283039] transition-colors">
                            <span className="material-symbols-outlined">refresh</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#18202a] border-b border-border-dark text-xs uppercase text-[#9dabb9] font-medium">
                                <th className="p-4">User</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Posts</th>
                                <th className="p-4">Last Login</th>
                                <th className="p-4">Joined</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-16 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-16 text-center text-[#9dabb9]">
                                        <span className="material-symbols-outlined text-4xl mb-2 block">manage_accounts</span>
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const roleDef = getRoleBadge(user.role);
                                    return (
                                        <tr key={user.id} className="hover:bg-[#1f2937] transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold ring-2 ring-[#283039]">
                                                        {user.firstName[0]}{user.lastName[0]}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-medium text-sm">{user.firstName} {user.lastName}</span>
                                                        <span className="text-[#9dabb9] text-xs">{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    className={`bg-transparent border rounded text-xs font-bold px-2 py-1 cursor-pointer focus:ring-1 focus:ring-primary ${roleDef.bg} ${roleDef.color} ${roleDef.border}`}
                                                >
                                                    {roles.map(r => (
                                                        <option key={r.key} value={r.key} className="bg-[#111418] text-white">{r.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    user.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                                }`}>
                                                    <span className={`size-1.5 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-white font-mono text-sm">{user._count?.posts || 0}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-[#9dabb9] text-sm">{user.lastLoginAt ? formatDate(user.lastLoginAt) : '--'}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-[#9dabb9] text-sm">{formatDate(user.createdAt)}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleDelete(user.id)} className="p-1.5 rounded text-[#9dabb9] hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Delete User">
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
