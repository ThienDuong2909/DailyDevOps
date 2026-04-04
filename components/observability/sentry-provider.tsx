'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/browser';

let initialized = false;

export function SentryProvider() {
    useEffect(() => {
        const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

        if (!dsn || initialized) {
            return;
        }

        Sentry.init({
            dsn,
            environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV,
            tracesSampleRate: Number.parseFloat(
                process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0'
            ),
        });

        initialized = true;
    }, []);

    return null;
}
