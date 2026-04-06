'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { extractApiMessage, normalizeAuthMessage } from '@/lib/auth/messages';
import { apiClient } from '@/lib/api';

function ResetPasswordPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token')?.trim() || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!token) {
            const nextMessage = 'Missing reset token.';
            setMessage(nextMessage);
            toast.error(nextMessage);
            return;
        }

        if (password !== confirmPassword) {
            const nextMessage = 'Passwords do not match.';
            setMessage(nextMessage);
            toast.error(nextMessage);
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await apiClient.post<{ message?: string }>('/api/v1/auth/reset-password', {
                token,
                password,
            });

            const nextMessage = response?.message || 'Password reset successfully';
            setMessage(nextMessage);
            toast.success(nextMessage);
            window.setTimeout(() => {
                router.push('/login');
            }, 1200);
        } catch (error: any) {
            const nextMessage = normalizeAuthMessage(
                extractApiMessage(
                    error,
                    'Unable to reset your password right now.'
                )
            );
            setMessage(nextMessage);
            toast.error(nextMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111418] dark:text-white min-h-screen flex flex-col relative overflow-hidden">
            <div
                className="absolute inset-0 z-0 opacity-40 dark:opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#137fec 0.5px, transparent 0.5px)',
                    backgroundSize: '24px 24px',
                }}
            />

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="w-full max-w-[480px] bg-white dark:bg-[#1a232e] rounded-xl shadow-lg border border-[#dbe0e6] dark:border-gray-700 overflow-hidden">
                    <div className="flex flex-col items-center pt-10 pb-4 px-8 text-center">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-primary text-4xl">encrypted</span>
                        </div>
                        <h1 className="text-[#111418] dark:text-white tracking-tight text-[28px] font-bold leading-tight">
                            Choose a new password
                        </h1>
                        <p className="text-[#617589] dark:text-gray-400 text-base font-normal leading-normal pt-2">
                            Create a new password for your DevOps Daily account.
                        </p>
                    </div>

                    <div className="px-8 pb-10">
                        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-2">
                                <label className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal">
                                    New Password
                                </label>
                                <input
                                    className="form-input flex w-full resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-[#1a232e] focus:border-primary h-12 placeholder:text-[#617589] px-4 text-base font-normal leading-normal transition-all"
                                    placeholder="Enter a new password"
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal">
                                    Confirm Password
                                </label>
                                <input
                                    className="form-input flex w-full resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-[#1a232e] focus:border-primary h-12 placeholder:text-[#617589] px-4 text-base font-normal leading-normal transition-all"
                                    placeholder="Re-enter your new password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            {message ? (
                                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-[#111418] dark:text-gray-200">
                                    {message}
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary hover:bg-blue-600 disabled:bg-primary/60 text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors shadow-md shadow-blue-500/20"
                            >
                                {isSubmitting ? 'Resetting password...' : 'Reset password'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link
                                className="text-sm text-[#617589] hover:text-[#111418] dark:text-gray-400 dark:hover:text-white transition-colors"
                                href="/login"
                            >
                                Back to sign in
                            </Link>
                        </div>
                    </div>

                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-primary to-blue-600" />
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                    <span className="size-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                </div>
            }
        >
            <ResetPasswordPageContent />
        </Suspense>
    );
}
