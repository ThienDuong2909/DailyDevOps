'use client';

import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';

type ResendVerificationFormProps = {
    defaultEmail?: string;
};

export function ResendVerificationForm({
    defaultEmail = '',
}: ResendVerificationFormProps) {
    const [email, setEmail] = useState(defaultEmail);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [verificationUrl, setVerificationUrl] = useState('');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setIsSubmitting(true);
            const response = await apiClient.post<{
                message?: string;
                data?: {
                    verificationToken?: string | null;
                };
            }>('/api/v1/auth/resend-verification', { email });

            setMessage(
                response?.message || 'If that account exists, a verification email has been sent.'
            );
            setVerificationUrl(
                response?.data?.verificationToken
                    ? `/verify-email?token=${encodeURIComponent(response.data.verificationToken)}`
                    : ''
            );
            toast.success('Verification email flow processed.');
        } catch (error: any) {
            const nextMessage =
                error?.response?.data?.message || 'Unable to resend verification right now.';
            setMessage(nextMessage);
            setVerificationUrl('');
            toast.error(nextMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                <label className="text-sm font-medium text-[#111418] dark:text-gray-200">
                    Resend verification email
                </label>
                <input
                    className="form-input h-11 rounded-lg border border-[#dbe0e6] bg-white px-4 text-sm text-[#111418] transition-all focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 dark:border-gray-600 dark:bg-[#1a232e] dark:text-white"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@devopsblog.com"
                    required
                    type="email"
                    value={email}
                />
                <button
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isSubmitting}
                    type="submit"
                >
                    {isSubmitting ? 'Sending...' : 'Resend verification'}
                </button>
            </form>

            {message ? (
                <div className="mt-3 text-sm text-[#617589] dark:text-gray-300">
                    <p>{message}</p>
                    {verificationUrl ? (
                        <Link
                            className="mt-2 inline-flex font-semibold text-primary hover:text-blue-600"
                            href={verificationUrl}
                        >
                            Open verification link
                        </Link>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
