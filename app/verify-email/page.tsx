'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

function VerifyEmailPageContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token')?.trim() || '';

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        let isMounted = true;

        const verify = async () => {
            if (!token) {
                if (!isMounted) return;
                setStatus('error');
                setMessage('Missing verification token.');
                return;
            }

            try {
                const response = await apiClient.post<{ message?: string }>(
                    '/api/v1/auth/verify-email',
                    { token }
                );

                if (!isMounted) return;
                setStatus('success');
                setMessage(response?.message || 'Email verified successfully');
            } catch (error: any) {
                if (!isMounted) return;
                setStatus('error');
                setMessage(
                    error?.response?.data?.message || 'Unable to verify this email right now.'
                );
            }
        };

        void verify();

        return () => {
            isMounted = false;
        };
    }, [token]);

    return (
        <div className="flex w-full max-w-[920px] flex-col gap-8">
            <section className="rounded-[32px] border border-gray-200 bg-white px-6 py-10 shadow-sm dark:border-gray-800 dark:bg-surface-dark md:px-10 md:py-14">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    Email verification
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-text-main dark:text-white md:text-4xl">
                    {status === 'success'
                        ? 'Your email is verified'
                        : status === 'error'
                          ? 'This verification link could not be completed'
                          : 'We are verifying your email'}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-text-sub dark:text-gray-400">
                    {message}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-600" href="/login">
                        Go to sign in
                    </Link>
                    <Link className="inline-flex h-11 items-center rounded-xl border border-gray-200 px-5 text-sm font-semibold text-text-main transition-colors hover:border-primary hover:text-primary dark:border-gray-700 dark:text-white" href="/register">
                        Back to register
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                    <span className="size-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                </div>
            }
        >
            <VerifyEmailPageContent />
        </Suspense>
    );
}
