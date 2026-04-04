'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/browser';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
            Sentry.captureException(error);
        } else {
            console.error(error);
        }
    }, [error]);

    return (
        <html lang="en">
            <body className="bg-background-dark text-white">
                <div className="flex min-h-screen items-center justify-center p-6">
                    <div className="w-full max-w-xl rounded-3xl border border-border-dark bg-[#111418] p-8 shadow-xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                            Application Error
                        </p>
                        <h1 className="mt-3 text-3xl font-black tracking-tight">
                            Something went wrong while rendering this page
                        </h1>
                        <p className="mt-4 text-sm leading-7 text-[#9dabb9]">
                            The error has been captured for investigation when Sentry is enabled.
                            You can retry the action or return to the homepage.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                onClick={() => reset()}
                                className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
                            >
                                Try again
                            </button>
                            <a
                                href="/"
                                className="inline-flex h-11 items-center rounded-lg border border-border-dark bg-[#1e293b] px-5 text-sm font-semibold text-white transition-colors hover:border-primary hover:text-primary"
                            >
                                Back home
                            </a>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
