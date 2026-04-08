'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, ShieldCheck, UserCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/hooks/use-auth';
import { buttonVariants } from '@/components/ui/button';
import { cn, getImageUrl } from '@/lib/utils';

function getDisplayName(firstName?: string, lastName?: string) {
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    return fullName || 'My Account';
}

export function HeaderAuthButton() {
    const router = useRouter();
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const {
        isAuthenticated,
        isInitialized,
        logout,
        user,
    } = useAuthStore();

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const canManageSite = useMemo(
        () =>
            ['ADMIN', 'MODERATOR', 'EDITOR'].includes(user?.role || ''),
        [user?.role]
    );

    if (!isInitialized) {
        return (
            <div className="h-10 w-28 animate-pulse rounded-lg bg-primary/15" />
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <Link
                href="/login"
                className={cn(buttonVariants(), 'h-10 rounded-lg px-5 text-sm font-bold')}
            >
                Login
            </Link>
        );
    }

    const workspaceHref = '/account';
    const displayName = getDisplayName(user.firstName, user.lastName);

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Logged out successfully');
            setIsOpen(false);
            router.push('/');
        } catch {
            toast.error('Logout failed');
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                className="flex h-10 items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-3 text-sm font-semibold text-text-main transition-all hover:border-primary/40 hover:bg-primary/15 dark:text-white"
                onClick={() => setIsOpen((value) => !value)}
                type="button"
            >
                {user.avatar ? (
                    <span
                        className="size-8 rounded-full bg-cover bg-center ring-1 ring-primary/30"
                        style={{ backgroundImage: `url("${getImageUrl(user.avatar)}")` }}
                    />
                ) : (
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
                        <UserCircle2 className="size-5" />
                    </span>
                )}
                <span className="hidden max-w-[160px] truncate sm:inline">
                    {displayName}
                </span>
                <span className="material-symbols-outlined !text-[18px] text-text-sub dark:text-gray-300">
                    expand_more
                </span>
            </button>

            {isOpen ? (
                <div className="absolute right-0 top-12 z-50 min-w-[220px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-[#111827]">
                    <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                        <p className="truncate text-sm font-semibold text-text-main dark:text-white">
                            {displayName}
                        </p>
                        <p className="truncate text-xs text-text-sub dark:text-gray-400">
                            {user.email}
                        </p>
                    </div>

                    <div className="p-2">
                        <Link
                            href={workspaceHref}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-main transition-colors hover:bg-primary/10 hover:text-primary dark:text-white"
                            onClick={() => setIsOpen(false)}
                        >
                            <UserCircle2 className="size-4" />
                            Ho so cua toi
                        </Link>

                        <Link
                            href={canManageSite ? '/admin/account' : '/account'}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-main transition-colors hover:bg-primary/10 hover:text-primary dark:text-white"
                            onClick={() => setIsOpen(false)}
                        >
                            <ShieldCheck className="size-4" />
                            Bao mat va MFA
                        </Link>

                        {canManageSite ? (
                            <Link
                                href="/admin"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-main transition-colors hover:bg-primary/10 hover:text-primary dark:text-white"
                                onClick={() => setIsOpen(false)}
                            >
                                <LayoutDashboard className="size-4" />
                                Giao dien quan ly
                            </Link>
                        ) : null}

                        <button
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-text-main transition-colors hover:bg-red-500/10 hover:text-red-500 dark:text-white"
                            onClick={() => void handleLogout()}
                            type="button"
                        >
                            <LogOut className="size-4" />
                            Dang xuat
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
