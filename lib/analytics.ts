import { hasAnalyticsConsent } from '@/lib/consent';

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

let analyticsId = '';

function postInternalEvent(
    eventType: string,
    payload: Record<string, string | number | boolean | undefined> = {}
) {
    if (typeof window === 'undefined') {
        return;
    }

    if (!hasAnalyticsConsent()) {
        return;
    }

    const body = JSON.stringify({
        eventType,
        payload,
    });

    if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon('/api/v1/analytics/events', blob);
        return;
    }

    void fetch('/api/v1/analytics/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body,
        keepalive: true,
        credentials: 'include',
    });
}

export function setAnalyticsId(nextId: string) {
    analyticsId = nextId.trim();
}

export function getAnalyticsId() {
    return analyticsId;
}

export function isAnalyticsReady() {
    return (
        typeof window !== 'undefined' &&
        typeof window.gtag === 'function' &&
        Boolean(analyticsId) &&
        hasAnalyticsConsent()
    );
}

export function trackEvent(
    eventName: string,
    params: Record<string, string | number | boolean | undefined> = {}
) {
    if (!isAnalyticsReady()) {
        return;
    }

    window.gtag?.('event', eventName, params);
}

export function trackPageView(path: string, title?: string) {
    if (!hasAnalyticsConsent()) {
        return;
    }

    if (!isAnalyticsReady()) {
        postInternalEvent('PAGE_VIEW', {
            path,
            title: title || (typeof document !== 'undefined' ? document.title : ''),
        });
        return;
    }

    window.gtag?.('config', analyticsId, {
        page_path: path,
        page_title: title || document.title,
        page_location: typeof window !== 'undefined' ? window.location.href : path,
    });

    postInternalEvent('PAGE_VIEW', {
        path,
        title: title || document.title,
    });
}

export function trackSearch(query: string, resultsCount: number) {
    postInternalEvent('SEARCH', {
        searchTerm: query,
        resultsCount,
    });
    trackEvent('search', {
        search_term: query,
        results_count: resultsCount,
    });
}

export function trackNewsletterSubscribe(location: string) {
    postInternalEvent('NEWSLETTER_SUBSCRIBE', {
        placement: location,
    });
    trackEvent('generate_lead', {
        form_name: 'newsletter_signup',
        placement: location,
    });
}

export function trackCommentSubmit(postSlug: string) {
    postInternalEvent('COMMENT_SUBMIT', {
        postSlug,
    });
    trackEvent('submit_comment', {
        post_slug: postSlug,
    });
}
