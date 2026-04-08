'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { trackNewsletterSubscribe } from '@/lib/analytics';
import { cn } from '@/lib/utils';

type NewsletterSignupFormProps = {
    buttonLabel?: string;
    className?: string;
    helperText?: string;
    inputClassName?: string;
    buttonClassName?: string;
    stacked?: boolean;
};

export function NewsletterSignupForm({
    buttonLabel = 'Subscribe',
    className = '',
    helperText = 'No spam, unsubscribe anytime.',
    inputClassName = '',
    buttonClassName = '',
    stacked = false,
}: NewsletterSignupFormProps) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState(helperText);
    const [confirmationUrl, setConfirmationUrl] = useState('');

    const resolvedFormClassName = useMemo(() => {
        if (stacked) {
            return 'flex flex-col gap-3';
        }

        return 'flex flex-col gap-2 sm:flex-row';
    }, [stacked]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!email.trim()) {
            setStatus('error');
            setMessage('Please enter your email before subscribing.');
            return;
        }

        try {
            setIsSubmitting(true);
            setStatus('idle');
            setMessage('Submitting your subscription...');

            const response = await apiClient.post<{
                message?: string;
                data?: {
                    confirmationToken?: string | null;
                };
            }>('/api/v1/subscribers', {
                email: email.trim(),
                name: name.trim() || undefined,
            });

            const nextConfirmationUrl = response?.data?.confirmationToken
                ? `/newsletter/confirm?token=${encodeURIComponent(response.data.confirmationToken)}`
                : '';

            setStatus('success');
            setMessage(
                response?.message ||
                    'Subscription created. Check your inbox and confirm to start receiving weekly updates.'
            );
            setConfirmationUrl(nextConfirmationUrl);
            trackNewsletterSubscribe('newsletter_form');
            setEmail('');
            setName('');
        } catch (error: unknown) {
            const fallbackMessage = 'Unable to subscribe right now. Please try again.';
            const errorMessage =
                typeof error === 'object' &&
                error !== null &&
                'response' in error &&
                typeof error.response === 'object' &&
                error.response !== null &&
                'data' in error.response &&
                typeof error.response.data === 'object' &&
                error.response.data !== null &&
                'message' in error.response.data &&
                typeof error.response.data.message === 'string'
                    ? error.response.data.message
                    : fallbackMessage;

            setStatus('error');
            setMessage(errorMessage);
            setConfirmationUrl('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const helperColorClassName =
        status === 'success'
            ? 'text-emerald-100'
            : status === 'error'
              ? 'text-red-100'
              : 'text-cyan-50/90';

    return (
        <div className={className}>
            <form className={resolvedFormClassName} onSubmit={handleSubmit}>
                <input
                    className={`rounded-xl border-0 px-4 py-3 text-sm text-text-main outline-none ring-0 ${inputClassName}`}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name (optional)"
                    type="text"
                    value={name}
                />
                <input
                    className={`rounded-xl border-0 px-4 py-3 text-sm text-text-main outline-none ring-0 ${inputClassName}`}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email"
                    required
                    type="email"
                    value={email}
                />
                <Button
                    className={cn('rounded-xl px-6', buttonClassName)}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    type="submit"
                >
                    {isSubmitting ? 'Submitting...' : buttonLabel}
                </Button>
            </form>
            <p className={`mt-2 text-xs ${helperColorClassName}`}>{message}</p>
            {status === 'success' && confirmationUrl ? (
                <div className="mt-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3">
                    <p className="text-xs text-white/90">
                        Confirm this subscription now if you want to skip waiting for the inbox link.
                    </p>
                    <Link
                        className="mt-2 inline-flex text-xs font-semibold text-white underline underline-offset-4"
                        href={confirmationUrl}
                    >
                        Open confirmation link
                    </Link>
                </div>
            ) : null}
        </div>
    );
}
