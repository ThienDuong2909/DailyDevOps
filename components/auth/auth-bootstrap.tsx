'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/hooks/use-auth';

export function AuthBootstrap() {
    const initializeAuth = useAuthStore((state) => state.initializeAuth);

    useEffect(() => {
        void initializeAuth();
    }, [initializeAuth]);

    return null;
}
