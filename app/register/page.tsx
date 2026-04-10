'use client';

import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ResendVerificationForm } from '@/components/auth/resend-verification-form';
import { Button } from '@/components/ui/button';
import { extractApiMessage, normalizeAuthMessage } from '@/lib/auth/messages';
import { apiClient } from '@/lib/api';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [verificationUrl, setVerificationUrl] = useState('');

    const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setIsSubmitting(true);
            const response = await apiClient.post<{
                message?: string;
                data?: {
                    verificationToken?: string | null;
                };
            }>('/api/v1/auth/register', formData);

            setMessage(
                response?.message || 'Account created. Check your inbox to verify your email.'
            );
            setVerificationUrl(
                response?.data?.verificationToken
                    ? `/verify-email?token=${encodeURIComponent(response.data.verificationToken)}`
                    : ''
            );
            toast.success('Account created successfully.');
            setFormData({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
            });
        } catch (error: any) {
            const nextMessage = normalizeAuthMessage(
                extractApiMessage(error, 'Unable to create your account right now.')
            );
            setMessage(nextMessage);
            setVerificationUrl('');
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
                <div className="w-full max-w-[520px] overflow-hidden rounded-xl border border-[#dbe0e6] bg-white shadow-lg dark:border-gray-700 dark:bg-[#1a232e]">
                    <div className="flex flex-col items-center px-8 pb-4 pt-10 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <span className="material-symbols-outlined text-4xl text-primary">person_add</span>
                        </div>
                        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[#111418] dark:text-white">
                            Create your DevOps Daily account
                        </h1>
                        <p className="pt-2 text-base font-normal leading-normal text-[#617589] dark:text-gray-400">
                            Register as an author account, then verify your email before signing in.
                        </p>
                    </div>

                    <div className="px-8 pb-10">
                        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium leading-normal text-[#111418] dark:text-gray-200">
                                        First Name
                                    </label>
                                    <input
                                        aria-label="First Name"
                                        className="form-input h-12 rounded-lg border border-[#dbe0e6] bg-white px-4 text-base text-[#111418] transition-all focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 dark:border-gray-600 dark:bg-[#1a232e] dark:text-white"
                                        required
                                        value={formData.firstName}
                                        onChange={(event) =>
                                            setFormData({ ...formData, firstName: event.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium leading-normal text-[#111418] dark:text-gray-200">
                                        Last Name
                                    </label>
                                    <input
                                        aria-label="Last Name"
                                        className="form-input h-12 rounded-lg border border-[#dbe0e6] bg-white px-4 text-base text-[#111418] transition-all focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 dark:border-gray-600 dark:bg-[#1a232e] dark:text-white"
                                        required
                                        value={formData.lastName}
                                        onChange={(event) =>
                                            setFormData({ ...formData, lastName: event.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium leading-normal text-[#111418] dark:text-gray-200">
                                    Email Address
                                </label>
                                <input
                                    aria-label="Email Address"
                                    className="form-input h-12 rounded-lg border border-[#dbe0e6] bg-white px-4 text-base text-[#111418] transition-all focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 dark:border-gray-600 dark:bg-[#1a232e] dark:text-white"
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium leading-normal text-[#111418] dark:text-gray-200">
                                    Password
                                </label>
                                <input
                                    aria-label="Password"
                                    className="form-input h-12 rounded-lg border border-[#dbe0e6] bg-white px-4 text-base text-[#111418] transition-all focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 dark:border-gray-600 dark:bg-[#1a232e] dark:text-white"
                                    minLength={6}
                                    required
                                    type="password"
                                    value={formData.password}
                                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                                />
                            </div>

                            {message ? (
                                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-[#111418] dark:text-gray-200">
                                    {message}
                                    {verificationUrl ? (
                                        <div className="mt-2">
                                            <Link
                                                className="font-semibold text-primary hover:text-blue-600"
                                                href={verificationUrl}
                                            >
                                                Open verification link
                                            </Link>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            <Button
                                className="h-12 w-full rounded-lg text-base font-bold tracking-[0.015em]"
                                disabled={isSubmitting}
                                loading={isSubmitting}
                                type="submit"
                            >
                                {isSubmitting ? 'Creating account...' : 'Create account'}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link
                                className="text-sm text-[#617589] transition-colors hover:text-[#111418] dark:text-gray-400 dark:hover:text-white"
                                href="/login"
                            >
                                Already have an account? Sign in
                            </Link>
                        </div>

                        <div className="mt-6">
                            <ResendVerificationForm defaultEmail={formData.email} />
                        </div>
                    </div>

                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-primary to-blue-600" />
                </div>
            </div>
        </div>
    );
}
