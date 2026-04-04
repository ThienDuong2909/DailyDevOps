'use client';

import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [resetUrl, setResetUrl] = useState('');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setIsSubmitting(true);
            const response = await apiClient.post<{
                message?: string;
                data?: {
                    resetToken?: string | null;
                };
            }>('/api/v1/auth/forgot-password', {
                email,
            });

            const nextMessage =
                response?.message || 'If that email exists, a reset link has been sent.';
            const nextResetUrl = response?.data?.resetToken
                ? `/reset-password?token=${encodeURIComponent(response.data.resetToken)}`
                : '';

            setMessage(nextMessage);
            setResetUrl(nextResetUrl);
            toast.success('Password reset instructions processed.');
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || 'Unable to process password reset right now.';
            setMessage(errorMessage);
            setResetUrl('');
            toast.error(errorMessage);
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
                            <span className="material-symbols-outlined text-primary text-4xl">lock_reset</span>
                        </div>
                        <h1 className="text-[#111418] dark:text-white tracking-tight text-[28px] font-bold leading-tight">
                            Reset your password
                        </h1>
                        <p className="text-[#617589] dark:text-gray-400 text-base font-normal leading-normal pt-2">
                            Enter your account email and we will send you a reset link.
                        </p>
                    </div>

                    <div className="px-8 pb-10">
                        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-2">
                                <label className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal">
                                    Email Address
                                </label>
                                <input
                                    className="form-input flex w-full resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-[#1a232e] focus:border-primary h-12 placeholder:text-[#617589] px-4 text-base font-normal leading-normal transition-all"
                                    placeholder="you@devopsblog.com"
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                />
                            </div>

                            {message ? (
                                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-[#111418] dark:text-gray-200">
                                    {message}
                                    {resetUrl ? (
                                        <div className="mt-2">
                                            <Link
                                                className="font-semibold text-primary hover:text-blue-600"
                                                href={resetUrl}
                                            >
                                                Open reset link
                                            </Link>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary hover:bg-blue-600 disabled:bg-primary/60 text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors shadow-md shadow-blue-500/20"
                            >
                                {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
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
