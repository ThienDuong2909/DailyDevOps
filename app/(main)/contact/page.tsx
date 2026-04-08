'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const contactChannels = [
    {
        title: 'Editorial and feedback',
        description: 'Reach the team for article ideas, corrections, or content suggestions.',
        actionLabel: 'Editorial workflow',
    },
    {
        title: 'Partnerships',
        description: 'Discuss collaborations, sponsorship ideas, or long-form technical campaigns.',
        actionLabel: 'Partnership requests',
    },
    {
        title: 'Newsletter support',
        description: 'Need help with subscription state, delivery, or newsletter preferences?',
        actionLabel: 'Subscriber help',
    },
];

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
        website: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [feedback, setFeedback] = useState('');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setIsSubmitting(true);
            const response = await apiClient.post<{ message?: string }>('/api/v1/contact', formData);

            setStatus('success');
            setFeedback(
                response?.message || 'Your message has been sent. We will get back to you soon.'
            );
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: '',
                website: '',
            });
        } catch (error: any) {
            setStatus('error');
            setFeedback(
                error?.response?.data?.message ||
                    'Unable to send your message right now. Please try again later.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const feedbackClassName =
        status === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
            : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300';

    return (
        <div className="flex w-full max-w-[1280px] flex-col gap-8">
            <section className="rounded-[32px] bg-slate-950 px-6 py-10 text-white shadow-xl md:px-10 md:py-14">
                <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                    <div className="space-y-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                            Contact
                        </p>
                        <h1 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
                            Start with the right channel, and we will keep the loop short
                        </h1>
                        <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                            Use the contact form for editorial questions, partnership interest, or
                            subscriber support. Messages are delivered directly to the DevOps Daily
                            inbox configured in the backend. We usually reply within 1-2 business days.
                        </p>
                    </div>

                    <form
                        className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur"
                        onSubmit={handleSubmit}
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                            Send a message
                        </p>
                        <div className="mt-5 grid gap-4">
                            <input
                                className="h-12 rounded-xl border border-white/10 bg-white/90 px-4 text-sm text-slate-950 outline-none focus:border-cyan-400"
                                onChange={(event) =>
                                    setFormData({ ...formData, name: event.target.value })
                                }
                                placeholder="Your name"
                                required
                                value={formData.name}
                            />
                            <input
                                className="h-12 rounded-xl border border-white/10 bg-white/90 px-4 text-sm text-slate-950 outline-none focus:border-cyan-400"
                                onChange={(event) =>
                                    setFormData({ ...formData, email: event.target.value })
                                }
                                placeholder="Your email"
                                required
                                type="email"
                                value={formData.email}
                            />
                            <input
                                className="h-12 rounded-xl border border-white/10 bg-white/90 px-4 text-sm text-slate-950 outline-none focus:border-cyan-400"
                                onChange={(event) =>
                                    setFormData({ ...formData, subject: event.target.value })
                                }
                                placeholder="Subject"
                                required
                                value={formData.subject}
                            />
                            <textarea
                                className="min-h-[160px] rounded-xl border border-white/10 bg-white/90 px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-400"
                                onChange={(event) =>
                                    setFormData({ ...formData, message: event.target.value })
                                }
                                placeholder="Tell us what you need help with"
                                required
                                value={formData.message}
                            />
                            <input
                                aria-hidden="true"
                                autoComplete="off"
                                className="hidden"
                                onChange={(event) =>
                                    setFormData({ ...formData, website: event.target.value })
                                }
                                tabIndex={-1}
                                value={formData.website}
                            />

                            {feedback ? (
                                <div className={`rounded-xl border px-4 py-3 text-sm ${feedbackClassName}`}>
                                    {feedback}
                                </div>
                            ) : null}

                            <p className="text-xs leading-6 text-slate-300">
                                Use this form for editorial questions, partnerships, and subscriber support.
                                For account access issues, include the email tied to your account.
                            </p>

                            <Button
                                className="h-12 rounded-xl bg-cyan-500 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
                                disabled={isSubmitting}
                                loading={isSubmitting}
                                type="submit"
                            >
                                {isSubmitting ? 'Sending message...' : 'Send message'}
                            </Button>
                        </div>
                    </form>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
                {contactChannels.map((channel) => (
                    <article
                        key={channel.title}
                        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark"
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            Contact path
                        </p>
                        <h2 className="mt-3 text-xl font-bold text-text-main dark:text-white">
                            {channel.title}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-text-sub dark:text-gray-400">
                            {channel.description}
                        </p>
                        <p className="mt-5 text-sm font-semibold text-primary">
                            {channel.actionLabel}
                        </p>
                    </article>
                ))}
            </section>

            <section className="rounded-[32px] border border-dashed border-gray-300 bg-white/70 px-6 py-8 dark:border-gray-700 dark:bg-surface-dark/60 md:px-10">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Related routes
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}
                        href="/newsletter"
                    >
                        Newsletter
                    </Link>
                    <Link
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}
                        href="/about"
                    >
                        About
                    </Link>
                    <Link
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}
                        href="/privacy-policy"
                    >
                        Privacy
                    </Link>
                </div>
            </section>
        </div>
    );
}
