'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useLocale } from '@/components/i18n/locale-provider';
import { withLocale } from '@/lib/i18n/config';

function NewsletterConfirmPageContent() {
    const searchParams = useSearchParams();
    const locale = useLocale();
    const token = searchParams.get('token')?.trim() || '';
    const copy =
        locale === 'en'
            ? {
                  loadingMessage: 'Confirming your newsletter subscription...',
                  missingToken: 'Missing confirmation token.',
                  successFallback: 'Subscription confirmed successfully',
                  errorFallback: 'Unable to confirm this subscription.',
                  eyebrow: 'Newsletter confirmation',
                  successTitle: 'Your subscription is confirmed',
                  errorTitle: 'This confirmation link could not be completed',
                  loadingTitle: 'We are confirming your subscription',
                  backToNewsletter: 'Back to newsletter',
                  goHome: 'Go to homepage',
              }
            : {
                  loadingMessage: 'Đang xác nhận đăng ký bản tin...',
                  missingToken: 'Thiếu mã xác nhận.',
                  successFallback: 'Đã xác nhận đăng ký thành công',
                  errorFallback: 'Không thể xác nhận đăng ký này.',
                  eyebrow: 'Xác nhận bản tin',
                  successTitle: 'Đăng ký của bạn đã được xác nhận',
                  errorTitle: 'Không thể hoàn tất liên kết xác nhận này',
                  loadingTitle: 'Chúng mình đang xác nhận đăng ký của bạn',
                  backToNewsletter: 'Quay lại bản tin',
                  goHome: 'Về trang chủ',
              };

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState(copy.loadingMessage);

    useEffect(() => {
        let isMounted = true;

        const confirmSubscription = async () => {
            if (!token) {
                if (!isMounted) {
                    return;
                }

                setStatus('error');
                setMessage(copy.missingToken);
                return;
            }

            try {
                const response = await apiClient.post<{ message?: string }>(
                    '/api/v1/subscribers/confirm',
                    { token }
                );

                if (!isMounted) {
                    return;
                }

                setStatus('success');
                setMessage(response?.message || copy.successFallback);
            } catch (error: unknown) {
                if (!isMounted) {
                    return;
                }

                const fallbackMessage = copy.errorFallback;
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
            }
        };

        void confirmSubscription();

        return () => {
            isMounted = false;
        };
    }, [copy.errorFallback, copy.missingToken, copy.successFallback, token]);

    return (
        <div className="flex w-full max-w-[920px] flex-col gap-8">
            <section className="rounded-[32px] border border-gray-200 bg-white px-6 py-10 shadow-sm dark:border-gray-800 dark:bg-surface-dark md:px-10 md:py-14">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    {copy.eyebrow}
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-text-main dark:text-white md:text-4xl">
                    {status === 'success'
                        ? copy.successTitle
                        : status === 'error'
                          ? copy.errorTitle
                          : copy.loadingTitle}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-text-sub dark:text-gray-400">
                    {message}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                        href={withLocale('/newsletter', locale)}
                        className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                    >
                        {copy.backToNewsletter}
                    </Link>
                    <Link
                        href={withLocale('/', locale)}
                        className="inline-flex h-11 items-center rounded-xl border border-gray-200 px-5 text-sm font-semibold text-text-main transition-colors hover:border-primary hover:text-primary dark:border-gray-700 dark:text-white"
                    >
                        {copy.goHome}
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default function NewsletterConfirmPage() {
    return (
        <Suspense
            fallback={
                <div className="flex w-full max-w-[920px] flex-col gap-8">
                    <section className="rounded-[32px] border border-gray-200 bg-white px-6 py-10 shadow-sm dark:border-gray-800 dark:bg-surface-dark md:px-10 md:py-14">
                        <div className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
                    </section>
                </div>
            }
        >
            <NewsletterConfirmPageContent />
        </Suspense>
    );
}
