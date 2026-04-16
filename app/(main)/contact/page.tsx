'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { useLocale } from '@/components/i18n/locale-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { withLocale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

const englishCopy = {
    channels: [
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
    ],
    successFallback: 'Your message has been sent. We will get back to you soon.',
    errorFallback: 'Unable to send your message right now. Please try again later.',
    eyebrow: 'Contact',
    title: 'Start with the right channel, and we will keep the loop short',
    intro:
        'Use the contact form for editorial questions, partnership interest, or subscriber support. Messages are delivered directly to the DevOps Daily inbox configured in the backend. We usually reply within 1-2 business days.',
    sendLabel: 'Send a message',
    namePlaceholder: 'Your name',
    emailPlaceholder: 'Your email',
    subjectPlaceholder: 'Subject',
    messagePlaceholder: 'Tell us what you need help with',
    helpText:
        'Use this form for editorial questions, partnerships, and subscriber support. For account access issues, include the email tied to your account.',
    sending: 'Sending message...',
    sendButton: 'Send message',
    contactPath: 'Contact path',
    relatedRoutes: 'Related routes',
    newsletter: 'Newsletter',
    about: 'About',
    privacy: 'Privacy',
};

const vietnameseCopy = {
    channels: [
        {
            title: 'Biên tập và phản hồi',
            description: 'Liên hệ đội ngũ về ý tưởng bài viết, đính chính hoặc gợi ý nội dung.',
            actionLabel: 'Luồng biên tập',
        },
        {
            title: 'Hợp tác',
            description: 'Trao đổi về tài trợ, hợp tác nội dung hoặc chiến dịch kỹ thuật dài hạn.',
            actionLabel: 'Yêu cầu hợp tác',
        },
        {
            title: 'Hỗ trợ bản tin',
            description: 'Cần hỗ trợ về trạng thái đăng ký, việc gửi mail hay tùy chọn newsletter?',
            actionLabel: 'Hỗ trợ subscriber',
        },
    ],
    successFallback: 'Tin nhắn của bạn đã được gửi. Chúng mình sẽ phản hồi sớm nhất có thể.',
    errorFallback: 'Hiện chưa thể gửi tin nhắn. Vui lòng thử lại sau.',
    eyebrow: 'Liên hệ',
    title: 'Bắt đầu từ đúng kênh, và chúng mình sẽ giữ vòng trao đổi ngắn gọn',
    intro:
        'Hãy dùng form liên hệ cho câu hỏi biên tập, nhu cầu hợp tác hoặc hỗ trợ subscriber. Tin nhắn sẽ được chuyển thẳng tới inbox Daily DevOps trên backend. Chúng mình thường phản hồi trong 1-2 ngày làm việc.',
    sendLabel: 'Gửi tin nhắn',
    namePlaceholder: 'Tên của bạn',
    emailPlaceholder: 'Email của bạn',
    subjectPlaceholder: 'Chủ đề',
    messagePlaceholder: 'Hãy cho chúng mình biết bạn đang cần hỗ trợ điều gì',
    helpText:
        'Hãy dùng form này cho câu hỏi biên tập, hợp tác và hỗ trợ subscriber. Nếu liên quan đến tài khoản, vui lòng ghi kèm email đang dùng.',
    sending: 'Đang gửi...',
    sendButton: 'Gửi tin nhắn',
    contactPath: 'Lối liên hệ',
    relatedRoutes: 'Các trang liên quan',
    newsletter: 'Bản tin',
    about: 'Giới thiệu',
    privacy: 'Quyền riêng tư',
};

export default function ContactPage() {
    const locale = useLocale();
    const copy = locale === 'en' ? englishCopy : vietnameseCopy;
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

    const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setIsSubmitting(true);
            const response = await apiClient.post<{ message?: string }>('/api/v1/contact', formData);

            setStatus('success');
            setFeedback(response?.message || copy.successFallback);
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: '',
                website: '',
            });
        } catch (error: any) {
            setStatus('error');
            setFeedback(error?.response?.data?.message || copy.errorFallback);
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
                            {copy.eyebrow}
                        </p>
                        <h1 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
                            {copy.title}
                        </h1>
                        <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                            {copy.intro}
                        </p>
                    </div>

                    <form
                        className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur"
                        onSubmit={handleSubmit}
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                            {copy.sendLabel}
                        </p>
                        <div className="mt-5 grid gap-4">
                            <input
                                className="h-12 rounded-xl border border-white/10 bg-white/90 px-4 text-sm text-slate-950 outline-none focus:border-cyan-400"
                                onChange={(event) =>
                                    setFormData({ ...formData, name: event.target.value })
                                }
                                placeholder={copy.namePlaceholder}
                                required
                                value={formData.name}
                            />
                            <input
                                className="h-12 rounded-xl border border-white/10 bg-white/90 px-4 text-sm text-slate-950 outline-none focus:border-cyan-400"
                                onChange={(event) =>
                                    setFormData({ ...formData, email: event.target.value })
                                }
                                placeholder={copy.emailPlaceholder}
                                required
                                type="email"
                                value={formData.email}
                            />
                            <input
                                className="h-12 rounded-xl border border-white/10 bg-white/90 px-4 text-sm text-slate-950 outline-none focus:border-cyan-400"
                                onChange={(event) =>
                                    setFormData({ ...formData, subject: event.target.value })
                                }
                                placeholder={copy.subjectPlaceholder}
                                required
                                value={formData.subject}
                            />
                            <textarea
                                className="min-h-[160px] rounded-xl border border-white/10 bg-white/90 px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-400"
                                onChange={(event) =>
                                    setFormData({ ...formData, message: event.target.value })
                                }
                                placeholder={copy.messagePlaceholder}
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

                            <p className="text-xs leading-6 text-slate-300">{copy.helpText}</p>

                            <Button
                                className="h-12 rounded-xl bg-cyan-500 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
                                disabled={isSubmitting}
                                loading={isSubmitting}
                                type="submit"
                            >
                                {isSubmitting ? copy.sending : copy.sendButton}
                            </Button>
                        </div>
                    </form>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
                {copy.channels.map((channel) => (
                    <article
                        key={channel.title}
                        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark"
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            {copy.contactPath}
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
                    {copy.relatedRoutes}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}
                        href={withLocale('/newsletter', locale)}
                    >
                        {copy.newsletter}
                    </Link>
                    <Link
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}
                        href={withLocale('/about', locale)}
                    >
                        {copy.about}
                    </Link>
                    <Link
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}
                        href={withLocale('/privacy-policy', locale)}
                    >
                        {copy.privacy}
                    </Link>
                </div>
            </section>
        </div>
    );
}
