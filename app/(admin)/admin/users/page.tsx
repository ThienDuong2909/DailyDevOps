'use client';

import { useState } from 'react';

// ==============================================
// TYPE DEFINITIONS
// ==============================================

interface UserAvatar {
    type: 'image' | 'count';
    url?: string;
    count?: number;
}

interface Role {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    userCount: number;
    avatars: UserAvatar[];
}

interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: 'ADMIN' | 'MODERATOR' | 'EDITOR' | 'VIEWER';
    status: 'Active' | 'Offline';
    lastActive: string;
}

interface Permission {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
}

interface PermissionGroup {
    id: string;
    name: string;
    icon: string;
    permissions: Permission[];
}

// ==============================================
// SAMPLE DATA - Replace with API data
// ==============================================

const sampleRoles: Role[] = [
    {
        id: '1',
        name: 'Administrator',
        description: 'Full access to all settings and user management.',
        icon: 'admin_panel_settings',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/20 ring-1 ring-primary/10',
        userCount: 4,
        avatars: [
            { type: 'image', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBz7dMwD29ui8gswGzDobgMxpEaLyaDL_GQMUmpPQBTSl_DlvokJg3Nl7YTRaAu12HUcqumpNS9GPMCKV3BRzWQrJaidh3HFlw1v3hq4HGMIIuA8h_VcqMIGpJqD98C3zQQwU2VzFbPnbnCqPh8hycYZuW-EEDXhFmKF7sljiZO0Di52taSZMZBcwNsN3ODQtJHO1Ypg8Z5KAvCurJ_tziHKrt55h8Y9CgDw7xsshlS5J14r4vKQlAE9RVujkG_n-zZ_pfFXddXlOd' },
            { type: 'image', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqsj4ASNmW9FORsAe8MmQEnP8I3GKvzQpIszFa9SdQCroppvPh-qmbfmkI9b0J7Uh7Un2aoAJzkJHz9PibmIJz12JqJaUmdLUsRuhj7XrZBPE_X-M4MxiQB0cXZeRAxs0y2VpCw_7NXSgkG09177dRKCMRoG_opS165MZ7q3Dm5UHy3k4tepZRXKzQ6EknuaSLkl3d9s78hUXX_06v_GvQ1RYlr3t_3qvZwdLb6s7UbW524-K_KaI1Ltt4RJbLADelKdpRSida25xy' },
            { type: 'count', count: 2 },
        ],
    },
    {
        id: '2',
        name: 'Moderator',
        description: 'Can manage content, comments, and user reports.',
        icon: 'shield_person',
        color: 'text-purple-600',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-gray-800',
        userCount: 8,
        avatars: [
            { type: 'image', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbZ1434nm6AEJTs3mUz02Mrsype1ExKmjDBTonZSUVU_IGoVEnG5ZNJZKOExsLABiV8S3aSRZqZUDGI4PJ2PsNHUoZiC0AXUow47fX9qHzPui_DQR4zW3BU0juVVKxD3VyKjBNSTxK7VFRi17NZeeayfA-CaDUUBd7g06En-tSh8Q7FiKY51CUoY35ZDXcOEv7NV2Wi9IIRwFVwlmTeMfl8-LIEthd0Lr2enf_-nKPW-1qhOL-K3-6k4wlFUNTMBCsXXfHjDFdLm9X' },
            { type: 'image', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAWFwkuZVPVCj5INF8Tw2JZBWxeID5kt4e8f1d2c3oqeeqmAVFJBwJEzUecgUziKtTt7uqjWBJasgyY7cV7Z7KBxnZonfS9kumFthqBcg19jE3WinqDmiMYjlx3k7OgpOoBtZEB5gwoIoIx6NsMhfOiEAacBOM60SdiLTwOjSZ7jeGKO-e5LMcInY0tF36TWgFk2gO1zzBhH0aUFX9swF_HpT4skjQ0yaLjJhgP0Ew45G-Kx2q0qQHoK9MEs-iHjI0axJoJN-ILTTa' },
            { type: 'image', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOIzvGM56mANaTA-hkG1zIucdok39YIts9lakIfTG5-gPQHGh4O8cTZrlcGnQDX5nHAwnJsZlLUVDrQi8HMyjMn_QkicIXuTcjRE5s50DBpd2MbbD6r5cGSzTBkOMzArJiEQcbX8A6Ipyq3DI6RWouCnyPUE2pX5Q2yhkzSAluweN9QDhIAi0XHpQpgwbz-chYD7daMRS8Bk7L6P0k652sFzBH_fX33ztEir06Q6ZRhvb_JjmNaG8h3OnZOUiq8u0Q8gkQnmDhu5gu' },
            { type: 'count', count: 5 },
        ],
    },
    {
        id: '3',
        name: 'Editor',
        description: 'Create, edit and publish blog posts and media.',
        icon: 'edit_document',
        color: 'text-blue-500',
        bgColor: 'bg-blue-400/10',
        borderColor: 'border-gray-800',
        userCount: 14,
        avatars: [
            { type: 'image', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8KH83LXQFUs7bf8PBpdT4_-7Hk7nfwQPiSt5Fmhf5Ojw5tbX25wxikSRVXkJDhc5jynGLnKLm8YM7bo4DwUikkHjbq94oEYV07iK34CDNu-nMlU7nSfbKkUj_eugCTp5lNkLTbsvHrA9F-oeoSP8N14k-BbQT-3RnERTnyCmFkOSPsf8FzqbxT69BqFHiur7gVA1TuWpxE0mIb6LL1FqPaCTjJyZI_hsNPdEWtR6P6Fefqzv2caCaFjKnnEC5VCIZrSahGpF-z_0d' },
            { type: 'image', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAumfdR7asMD6ptHiKH7yGyfruzXzq2-V1FioWErqL_uwufXyVS21iQm1T8UJrN1HYG12fIeoXCJrTNFOxOHNYHOq2xY44N4SQ4I79eQ9sgPi9IszP9zFYoF3PLN4Wd5bQGQm4iagA34nOXyaoLSlbYs3LwenD8CYRxIh9EHHH9FnBp6Z9GavnfT6e_NC_W49Z6zxJmAAk-aSd1uIFJKcd7NEPb-3K1Pu0QwaV-q0USXcoZKQcIvXqYg4NRu_QKt33VM8YzBof2I7xV' },
            { type: 'count', count: 12 },
        ],
    },
    {
        id: '4',
        name: 'Viewer',
        description: 'Read-only access to published content.',
        icon: 'visibility',
        color: 'text-green-600',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-gray-800',
        userCount: 856,
        avatars: [
            { type: 'count', count: 856 },
        ],
    },
];

const sampleUsers: User[] = [
    {
        id: '1',
        name: 'Sarah Jenkins',
        email: 'sarah.j@devops.com',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBo4tWoLcSoqXUxBW8uZNd5ovAGPWC4bD6oVyIgoFGSW9zceRwokNjTJ4ixebB6Fu0BPQjYvM60JUGmIEjjf8XvsOG6UC0cQEaGAv9IVVYf5xV-EzSuXIwdQwKBJKDz7ECbctercDATvskWp1zm_sL1cZ5zZjUAbuLSCRYfxJihUQG910n_xbArMkMwsX7EELiPJM2OawhgNFdb5y2A7TaenLJNU7hFLocrYAmzDcYCIU8KEXemhL84Ohec3ZeE6KmFSKk63Op-ZcBt',
        role: 'EDITOR',
        status: 'Active',
        lastActive: '2 mins ago',
    },
    {
        id: '2',
        name: 'Michael Chen',
        email: 'm.chen@devops.com',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvXEjKxbPpNiemOeAwEz40Uxq-laIf7x8ombUw2nhvUZqvG8_FoEX-zOrzMKpUtFXQxM1b8Q-k-Pvg_e7x4afJO-qPhOD-ayJ03Donj-YMRcEoJYzh0MmKKux-xKdTADoeZoaM1xcEjHs5J0eQgRm8djEmdXXVePO1nKV36ZxeMF3jMW5UF64S3lWwQtvHnFFR655J2eLpAM9zd8nYPpJJhsVSUwj2TjEYl47fhlMlavna2vNudB2fGZ_KlJhGMyFhzCx6ZTTio59d',
        role: 'ADMIN',
        status: 'Active',
        lastActive: '1 hour ago',
    },
    {
        id: '3',
        name: 'Jessica Wong',
        email: 'jess.wong@devops.com',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-hnoJ6UEjBcdGHSbdRAsOCfOsS4sn93zgxhF9KFRZcaAvjnyrniyTO4Y7UYW169K7C0WFP7BY2q58KdvA2jtJbrHPxcwUmSdk-dJ1GoNPVWtiWj6Yw4-i3_Z664mxyBVAuZA4EH6Y8JW0BQl1LhUHN1Go4GDgfwzJSeVsa8FlZTwvGkAotYatyBZzTQT1NLkc5kucJVUupHNtrSbjNiAk0vjVKlK8JswG058EpW4bxgFWd_VQrfMik3yG1LrrHEyTlMbOGCvshr0y',
        role: 'MODERATOR',
        status: 'Offline',
        lastActive: '3 days ago',
    },
    {
        id: '4',
        name: 'David Miller',
        email: 'd.miller@devops.com',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkbsQHNg4BQ3p3HZfkNhYZlcXIAOu-1PwPuXYe_VQ4tdV58wNCVc2w_4bZYAtEDIhGdB2HCQ4M5BBThowwLB53HVHpDKOtyi0NeomncwIk_3CDQcRDp-wVAtjK0mwLMJJFpJAseK8GwSPtgLqQfDnE76d4xXduyr_Mzv6g5UTAH8PGU_suo2Wl_AmbrvtB4TSHTQ_rOgNEB2CBNi_HUCxKY_9u1gMNT01sRVtBc4NHJ4VecDeQYZA5ivtjCuvUoViq5GCfGINrlpZH',
        role: 'VIEWER',
        status: 'Active',
        lastActive: 'Just now',
    },
    {
        id: '5',
        name: 'Emily Blunt',
        email: 'e.blunt@devops.com',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApM8RKXwyfRlda4PVB8Apd40xdPfJ0yvXTW7w4_LWFX9300dc0lAO0D0J5oslLSbm5_LLw7gNTFRmXUK8XyxjXJTEjeBKFq_QiJCi91HLtbRnfIAV5Cukt9B9gvzcxXGVRLS2uKBnyVn1xKxEfZUx10ybS2FiKh_aq2_nEyAbtMbHCVB21ySCQCI2mWTHU_50DOxo4OXTYCZTDdO6HzT9f6hJsCaPoNZj66oxmH9GjCxJo44b-y-h4Ca4e7kcy3vBoDb4wQsykFbON',
        role: 'EDITOR',
        status: 'Offline',
        lastActive: 'Yesterday',
    },
];

const samplePermissionGroups: PermissionGroup[] = [
    {
        id: '1',
        name: 'Content Management',
        icon: 'article',
        permissions: [
            { id: '1-1', name: 'Create Posts', description: 'Allow creating new blog entries', enabled: true },
            { id: '1-2', name: "Edit Others' Posts", description: 'Modify content created by other users', enabled: false },
            { id: '1-3', name: 'Publish Content', description: 'Make drafts public', enabled: true },
        ],
    },
    {
        id: '2',
        name: 'Media Library',
        icon: 'image',
        permissions: [
            { id: '2-1', name: 'Upload Files', description: 'Upload images and documents', enabled: true },
            { id: '2-2', name: 'Delete Files', description: 'Remove files permanently', enabled: false },
        ],
    },
    {
        id: '3',
        name: 'System',
        icon: 'settings',
        permissions: [
            { id: '3-1', name: 'Manage Settings', description: 'Access global configuration', enabled: false },
        ],
    },
];

// ==============================================
// HELPER FUNCTIONS
// ==============================================

function getRoleBadge(role: User['role']) {
    switch (role) {
        case 'ADMIN':
            return 'bg-primary/10 text-primary border-primary/20';
        case 'MODERATOR':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border-purple-200 dark:border-purple-800';
        case 'EDITOR':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-800';
        case 'VIEWER':
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
}

function getRoleName(role: User['role']) {
    switch (role) {
        case 'ADMIN':
            return 'Administrator';
        case 'MODERATOR':
            return 'Moderator';
        case 'EDITOR':
            return 'Editor';
        case 'VIEWER':
            return 'Viewer';
        default:
            return role;
    }
}

function getRoleAccentColor(roleName: string) {
    switch (roleName) {
        case 'Administrator':
            return 'bg-primary';
        case 'Moderator':
            return 'bg-purple-500';
        case 'Editor':
            return 'bg-blue-400';
        case 'Viewer':
            return 'bg-green-500';
        default:
            return 'bg-gray-500';
    }
}

// ==============================================
// MAIN COMPONENT
// ==============================================

export default function UsersRolesPage() {
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('All Roles');
    const [selectedRole, setSelectedRole] = useState<string>('Editor');
    const [permissionGroups, setPermissionGroups] = useState(samplePermissionGroups);
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 5;
    const totalUsers = 882;

    // Filter users based on selected role
    const filteredUsers = sampleUsers.filter((user) => {
        if (selectedRoleFilter === 'All Roles') return true;
        return getRoleName(user.role) === selectedRoleFilter;
    });

    // Toggle permission handler
    const togglePermission = (groupId: string, permissionId: string) => {
        setPermissionGroups((prev) =>
            prev.map((group) => {
                if (group.id === groupId) {
                    return {
                        ...group,
                        permissions: group.permissions.map((perm) => {
                            if (perm.id === permissionId) {
                                return { ...perm, enabled: !perm.enabled };
                            }
                            return perm;
                        }),
                    };
                }
                return group;
            })
        );
    };

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col gap-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-white">User Roles &amp; Permissions</h2>
                    <p className="text-sm text-[#9dabb9] mt-1">Manage access control across the DevOps platform</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-surface-dark border border-border-dark rounded-lg text-sm font-medium text-white hover:bg-[#283039] transition-colors shadow-sm">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            download
                        </span>
                        Export Audit Log
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-sm font-medium text-white transition-colors shadow-md shadow-primary/20">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            add
                        </span>
                        Create New Role
                    </button>
                </div>
            </div>

            {/* Role Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {sampleRoles.map((role) => (
                    <div
                        key={role.id}
                        className={`bg-surface-dark rounded-xl border ${role.borderColor} shadow-sm flex flex-col relative overflow-hidden group hover:shadow-md transition-all`}
                    >
                        {/* Left Accent Bar */}
                        <div className={`absolute top-0 left-0 w-1 h-full ${getRoleAccentColor(role.name)}`} />

                        <div className="p-6 flex flex-col h-full">
                            {/* Header: Icon & Avatars */}
                            <div className="flex justify-between items-start mb-4">
                                <div className={`size-10 rounded-lg ${role.bgColor} flex items-center justify-center ${role.color}`}>
                                    <span className="material-symbols-outlined">{role.icon}</span>
                                </div>
                                <div className="flex -space-x-2">
                                    {role.avatars.map((avatar, idx) =>
                                        avatar.type === 'image' ? (
                                            <div
                                                key={idx}
                                                className="size-8 rounded-full border-2 border-surface-dark bg-gray-200 bg-cover bg-center"
                                                style={{ backgroundImage: `url("${avatar.url}")` }}
                                            />
                                        ) : (
                                            <div
                                                key={idx}
                                                className="size-8 rounded-full border-2 border-surface-dark bg-gray-700 flex items-center justify-center text-[10px] font-bold text-[#9dabb9]"
                                            >
                                                {avatar.count && avatar.count > 99 ? avatar.count : `+${avatar.count}`}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Role Name & Description */}
                            <h3 className="text-lg font-bold text-white mb-1">{role.name}</h3>
                            <p className="text-xs text-[#9dabb9] mb-4">{role.description}</p>

                            {/* Footer */}
                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-border-dark">
                                <span className="text-sm font-medium text-white">{role.userCount} Users</span>
                                <button className="text-primary hover:text-primary-dark text-sm font-medium transition-colors">
                                    Edit Role
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content: Users Table & Permissions Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-6">
                {/* Users Table */}
                <div className="lg:col-span-2 bg-surface-dark rounded-xl border border-border-dark shadow-sm overflow-hidden flex flex-col h-[600px]">
                    {/* Table Header */}
                    <div className="p-5 border-b border-border-dark flex justify-between items-center bg-[#111418]">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white">All Users</h3>
                            <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full font-medium">
                                {totalUsers}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                                    <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '18px' }}>
                                        filter_list
                                    </span>
                                </span>
                                <select
                                    value={selectedRoleFilter}
                                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                                    className="pl-8 pr-8 py-1.5 text-xs bg-[#111418] border border-border-dark rounded-md text-white focus:ring-primary focus:border-primary cursor-pointer"
                                >
                                    <option>All Roles</option>
                                    <option>Administrator</option>
                                    <option>Moderator</option>
                                    <option>Editor</option>
                                    <option>Viewer</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="overflow-auto flex-1 p-0">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#283039] text-[#9dabb9] font-medium sticky top-0 z-10">
                                <tr>
                                    <th className="px-5 py-3 font-medium">User</th>
                                    <th className="px-5 py-3 font-medium">Role</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">Last Active</th>
                                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-dark text-gray-300">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="size-8 rounded-full bg-gray-200 bg-cover bg-center"
                                                    style={{ backgroundImage: `url("${user.avatar}")` }}
                                                />
                                                <div>
                                                    <div className="font-medium text-white">{user.name}</div>
                                                    <div className="text-xs text-[#9dabb9]">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getRoleBadge(user.role)}`}
                                            >
                                                {getRoleName(user.role)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            {user.status === 'Active' ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                                                    <span className="size-1.5 rounded-full bg-green-500" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-xs text-[#9dabb9]">
                                                    <span className="size-1.5 rounded-full bg-gray-400" />
                                                    Offline
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-xs text-[#9dabb9]">{user.lastActive}</td>
                                        <td className="px-5 py-3 text-right">
                                            <button className="p-1 rounded hover:bg-gray-700 text-[#9dabb9] transition-colors">
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                                    more_vert
                                                </span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-border-dark flex items-center justify-between">
                        <span className="text-xs text-[#9dabb9]">
                            Showing 1-{filteredUsers.length} of {totalUsers} users
                        </span>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 text-xs border border-border-dark rounded hover:bg-[#283039] text-[#9dabb9] transition-colors">
                                Previous
                            </button>
                            <button className="px-3 py-1 text-xs border border-border-dark rounded hover:bg-[#283039] text-[#9dabb9] transition-colors">
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                {/* Role Permissions Panel */}
                <div className="bg-surface-dark rounded-xl border border-border-dark shadow-sm overflow-hidden flex flex-col h-[600px]">
                    {/* Panel Header */}
                    <div className="p-5 border-b border-border-dark flex flex-col gap-1 bg-[#111418]">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-white">Role Permissions</h3>
                            <span className="text-xs font-mono bg-blue-900/50 text-blue-200 px-2 py-0.5 rounded border border-blue-800">
                                {selectedRole}
                            </span>
                        </div>
                        <p className="text-xs text-[#9dabb9]">Configure access levels for the selected role.</p>
                    </div>

                    {/* Permissions List */}
                    <div className="overflow-auto flex-1 p-5 space-y-6">
                        {permissionGroups.map((group) => (
                            <div key={group.id}>
                                <h4 className="text-xs font-bold text-[#9dabb9] uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                        {group.icon}
                                    </span>
                                    {group.name}
                                </h4>
                                <div className="space-y-3">
                                    {group.permissions.map((permission) => (
                                        <div key={permission.id} className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-white">{permission.name}</span>
                                                <span className="text-[10px] text-[#9dabb9]">{permission.description}</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={permission.enabled}
                                                    onChange={() => togglePermission(group.id, permission.id)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Save Button */}
                    <div className="p-4 border-t border-border-dark bg-[#111418]">
                        <button className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
