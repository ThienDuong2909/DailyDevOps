'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/hooks/use-auth';

export function AuthBootstrap() {
    const initializeAuth = useAuthStore((state) => state.initializeAuth);

    useEffect(() => {
        void initializeAuth();

        const handleAuthExpired = () => {
            useAuthStore.setState({
                user: null,
                isAuthenticated: false,
                isInitialized: true,
                error: null,
            });
            localStorage.removeItem('accessToken');
            toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        };

        globalThis.addEventListener('auth-expired', handleAuthExpired as EventListener);
        return () => globalThis.removeEventListener('auth-expired', handleAuthExpired as EventListener);
    }, [initializeAuth]);

    return null;
}
