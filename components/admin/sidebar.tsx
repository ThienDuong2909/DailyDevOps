'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth';
import toast from 'react-hot-toast';

interface NavItem {
    label: string;
    href: string;
    icon: string;
    badge?: number;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin', icon: 'dashboard' },
    { label: 'Articles', href: '/admin/articles', icon: 'article' },
    { label: 'Comments', href: '/admin/comments', icon: 'chat', badge: 23 },
    { label: 'SEO Manager', href: '/admin/seo', icon: 'search' },
    { label: 'Performance', href: '/admin/performance', icon: 'monitoring' },
    { label: 'Roles & Users', href: '/admin/users', icon: 'manage_accounts' },
];

const bottomItems: NavItem[] = [
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
        <aside className="hidden lg:flex flex-col w-[280px] h-full bg-[#111418] border-r border-border-dark flex-shrink-0">
            <div className="p-6 flex flex-col h-full justify-between">
                <div>
                    {/* Profile / Brand */}
                    <div className="flex items-center gap-4 mb-8">
                        <div
                            className="bg-center bg-no-repeat bg-cover rounded-full size-12 border-2 border-border-dark"
                            style={{
                                backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuAYwa5RYhMpWN2Zu9mX8Dm2D94pw2ejreOlwViiOGBifn_FunjZvSiMq8aGr5ZtzAkGY-fkzIH_F-jvm-ObMr-0x95JMpIfOe9BMFn44fr0Nc1S-oPjLWGHm6YH1aqw5pK5AEqSTJAtOw3nvpHZBH1VDzTjLmaeEG7Ijur2L_JooJm5pqgMQlAeLpb8eYvwfiRZzMVxvyFNykeOIjM1wma5VpngmF21T0qAJuKQnXBgojIkSPaJY_lkYrM3gUwUYE2I4Be8KNV3B30Q")`,
                            }}
                        />
                        <div className="flex flex-col">
                            <h1 className="text-white text-base font-bold leading-tight">
                                {user ? `${user.firstName} ${user.lastName}` : 'DevOps Admin'}
                            </h1>
                            <p className="text-[#9dabb9] text-xs font-mono">v2.4.0-stable</p>
                        </div>
                    </div>

                    {/* Menu */}
                    <nav className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg group transition-all ${isActive(item.href)
                                        ? 'bg-primary/10 border-l-4 border-primary'
                                        : 'hover:bg-surface-dark border-l-4 border-transparent'
                                    }`}
                            >
                                <span
                                    className={`material-symbols-outlined ${isActive(item.href)
                                            ? 'text-primary'
                                            : 'text-[#9dabb9] group-hover:text-white'
                                        }`}
                                >
                                    {item.icon}
                                </span>
                                <p
                                    className={`text-sm font-medium ${isActive(item.href)
                                            ? 'text-white'
                                            : 'text-[#9dabb9] group-hover:text-white'
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

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-border-dark">
                    {bottomItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-surface-dark text-[#9dabb9] hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">{item.icon}</span>
                            <p className="text-sm font-medium">{item.label}</p>
                        </Link>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-surface-dark text-[#fa6238] hover:text-[#fa6238]/80 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        <p className="text-sm font-medium">Logout</p>
                    </button>
                </div>
            </div>
        </aside>
    );
}
