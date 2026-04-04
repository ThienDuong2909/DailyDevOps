'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/hooks/use-auth';

interface NavItem {
    label: string;
    href: string;
    icon: string;
    badge?: number;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin', icon: 'dashboard' },
    { label: 'Articles', href: '/admin/articles', icon: 'article' },
    { label: 'Categories', href: '/admin/categories', icon: 'folder_open' },
    { label: 'Tags', href: '/admin/tags', icon: 'sell' },
    { label: 'Media Library', href: '/admin/media', icon: 'imagesmode' },
    { label: 'Comments', href: '/admin/comments', icon: 'chat', badge: 23 },
    { label: 'Newsletter', href: '/admin/newsletter', icon: 'mail' },
    { label: 'SEO Manager', href: '/admin/seo', icon: 'search' },
    { label: 'Performance', href: '/admin/performance', icon: 'monitoring' },
    { label: 'Compliance', href: '/admin/compliance', icon: 'policy' },
    { label: 'Backup & Export', href: '/admin/ops', icon: 'database_backup' },
    { label: 'Roles & Users', href: '/admin/users', icon: 'manage_accounts' },
];

const bottomItems: NavItem[] = [
    { label: 'Account Security', href: '/admin/account', icon: 'shield_lock' },
    { label: 'System Settings', href: '/admin/settings', icon: 'settings' },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { logout, user } = useAuthStore();

    const isActive = (href: string) => {
        if (href === '/admin') {
            return pathname === '/admin';
        }

        return pathname.startsWith(href);
    };

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Logged out successfully');
            router.push('/login');
        } catch (error) {
            toast.error('Logout failed');
        }
    };

    return (
        <aside className="theme-surface hidden h-full w-[280px] flex-shrink-0 flex-col border-r lg:flex">
            <div className="p-6 flex flex-col h-full justify-between">
                <div>
                    <div className="flex items-center gap-4 mb-8">
                        <div
                            className="bg-center bg-no-repeat bg-cover rounded-full size-12 border-2 border-border-dark"
                            style={{
                                backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuAYwa5RYhMpWN2Zu9mX8Dm2D94pw2ejreOlwViiOGBifn_FunjZvSiMq8aGr5ZtzAkGY-fkzIH_F-jvm-ObMr-0x95JMpIfOe9BMFn44fr0Nc1S-oPjLWGHm6YH1aqw5pK5AEqSTJAtOw3nvpHZBH1VDzTjLmaeEG7Ijur2L_JooJm5pqgMQlAeLpb8eYvwfiRZzMVxvyFNykeOIjM1wma5VpngmF21T0qAJuKQnXBgojIkSPaJY_lkYrM3gUwUYE2I4Be8KNV3B30Q")`,
                            }}
                        />
                        <div className="flex flex-col">
                            <h1 className="text-base font-bold leading-tight text-[color:var(--text-main-theme)]">
                                {user ? `${user.firstName} ${user.lastName}` : 'DevOps Admin'}
                            </h1>
                            <p className="theme-muted text-xs font-mono">v2.4.0-stable</p>
                        </div>
                    </div>

                    <nav className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg group transition-all ${isActive(item.href)
                                    ? 'border-l-4 border-primary bg-[color:color-mix(in_srgb,var(--primary-theme)_12%,transparent)]'
                                    : 'border-l-4 border-transparent hover:bg-[color:var(--surface-muted)]'
                                    }`}
                            >
                                <span
                                    className={`material-symbols-outlined ${isActive(item.href)
                                        ? 'text-primary'
                                        : 'text-[color:var(--text-muted-theme)] group-hover:text-[color:var(--text-main-theme)]'
                                        }`}
                                >
                                    {item.icon}
                                </span>
                                <p
                                    className={`text-sm font-medium ${isActive(item.href)
                                        ? 'text-[color:var(--text-main-theme)]'
                                        : 'text-[color:var(--text-muted-theme)] group-hover:text-[color:var(--text-main-theme)]'
                                        }`}
                                >
                                    {item.label}
                                </p>
                                {item.badge && (
                                    <span className="ml-auto bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="theme-border pt-4 border-t">
                    {bottomItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 rounded-lg px-4 py-2 text-[color:var(--text-muted-theme)] transition-colors hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text-main-theme)]"
                        >
                            <span className="material-symbols-outlined text-lg">{item.icon}</span>
                            <p className="text-sm font-medium">{item.label}</p>
                        </Link>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-[#fa6238] transition-colors hover:bg-[color:var(--surface-muted)] hover:text-[#fa6238]/80"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        <p className="text-sm font-medium">Logout</p>
                    </button>
                </div>
            </div>
        </aside>
    );
}
