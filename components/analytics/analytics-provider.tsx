'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { setAnalyticsId, trackPageView } from '@/lib/analytics';
import {
    CONSENT_EVENT_NAME,
    hasAnalyticsConsent,
    readConsent,
} from '@/lib/consent';

type PublicSeoConfig = {
    analyticsId?: string;
};

function ensureGoogleTagLoaded(measurementId: string) {
    if (typeof window === 'undefined' || !measurementId) {
        return;
    }

    if (!document.querySelector(`script[data-gtag-id="${measurementId}"]`)) {
        const externalScript = document.createElement('script');
        externalScript.async = true;
        externalScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
        externalScript.dataset.gtagId = measurementId;
        document.head.appendChild(externalScript);
    }

    if (!window.dataLayer) {
        window.dataLayer = [];
    }

    if (!window.gtag) {
        window.gtag = function gtag(...args: unknown[]) {
            window.dataLayer?.push(args);
        };
        window.gtag('js', new Date());
    }

    window.gtag('config', measurementId, {
        send_page_view: false,
    });
}

export function AnalyticsProvider() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [measurementId, setMeasurementId] = useState('');
    const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
    const hasTrackedInitialView = useRef(false);

    useEffect(() => {
        setAnalyticsAllowed(hasAnalyticsConsent());

        const handleConsentChange = () => {
            setAnalyticsAllowed(Boolean(readConsent()?.preferences.analytics));
        };

        window.addEventListener(CONSENT_EVENT_NAME, handleConsentChange as EventListener);
        return () => {
            window.removeEventListener(CONSENT_EVENT_NAME, handleConsentChange as EventListener);
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/v1/seo/public-config', {
                    cache: 'no-store',
                });

                if (!response.ok) {
                    return;
                }

                const payload = (await response.json()) as {
                    data?: PublicSeoConfig;
                };
                const nextMeasurementId = payload?.data?.analyticsId?.trim() || '';

                if (!isMounted || !nextMeasurementId) {
                    return;
                }

                setAnalyticsId(nextMeasurementId);
                setMeasurementId(nextMeasurementId);
                if (hasAnalyticsConsent()) {
                    ensureGoogleTagLoaded(nextMeasurementId);
                }
            } catch {
                // Analytics is optional. Fail silently when config is unavailable.
            }
        };

        void fetchConfig();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!measurementId || !analyticsAllowed) {
            return;
        }

        const queryString = searchParams?.toString();
        const nextPath = queryString ? `${pathname}?${queryString}` : pathname;

        if (!hasTrackedInitialView.current) {
            hasTrackedInitialView.current = true;
        }

        trackPageView(nextPath || '/');
    }, [analyticsAllowed, measurementId, pathname, searchParams]);

    useEffect(() => {
        if (!measurementId || !analyticsAllowed) {
            return;
        }

        ensureGoogleTagLoaded(measurementId);
    }, [analyticsAllowed, measurementId]);

    return null;
}
