'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDashboardSkeleton } from '@/components/admin/admin-dashboard-skeleton';
import { useAuthStore } from '@/hooks/use-auth';
import { resolvePostLoginRoute } from '@/lib/auth/redirects';

const adminRoles = new Set(['ADMIN', 'MODERATOR', 'EDITOR']);

interface AdminRouteGuardProps {
    children: React.ReactNode;
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
    const router = useRouter();
    const { initializeAuth, isAuthenticated, isInitialized, user } =
        useAuthStore();

    useEffect(() => {
        void initializeAuth();
    }, [initializeAuth]);

    useEffect(() => {
        if (!isInitialized) {
            return;
        }

        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        if (!adminRoles.has(user?.role || '')) {
            router.replace(resolvePostLoginRoute(user?.role));
        }
    }, [isAuthenticated, isInitialized, router, user?.role]);

    if (!isInitialized) {
        return <AdminDashboardSkeleton />;
    }

    if (!isAuthenticated || !adminRoles.has(user?.role || '')) {
        return <AdminDashboardSkeleton />;
    }

    return <>{children}</>;
}
