export const CONSENT_STORAGE_KEY = 'devopsdaily-cookie-consent';
export const CONSENT_EVENT_NAME = 'devopsdaily-consent-change';

export type ConsentPreferences = {
    essential: true;
    analytics: boolean;
    marketing: boolean;
};

export type ConsentStatus = 'accepted' | 'essential-only' | 'customized';

export type ConsentRecord = {
    consentId: string;
    status: ConsentStatus;
    preferences: ConsentPreferences;
    updatedAt: string;
};

export const defaultConsentPreferences: ConsentPreferences = {
    essential: true,
    analytics: false,
    marketing: false,
};

function createConsentId() {
    return `consent-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function readConsent(): ConsentRecord | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);

        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as Partial<ConsentRecord>;

        if (!parsed?.consentId || !parsed?.preferences) {
            return null;
        }

        return {
            consentId: parsed.consentId,
            status: (parsed.status as ConsentStatus) || 'essential-only',
            preferences: {
                essential: true,
                analytics: Boolean(parsed.preferences.analytics),
                marketing: Boolean(parsed.preferences.marketing),
            },
            updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
    } catch {
        return null;
    }
}

export function hasAnalyticsConsent() {
    return Boolean(readConsent()?.preferences.analytics);
}

export async function saveConsent(record: Omit<ConsentRecord, 'updatedAt'>) {
    const nextRecord: ConsentRecord = {
        ...record,
        updatedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(nextRecord));
        window.dispatchEvent(new CustomEvent(CONSENT_EVENT_NAME, { detail: nextRecord }));
    }

    try {
        await fetch('/api/v1/consent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                consentId: nextRecord.consentId,
                status: nextRecord.status,
                preferences: nextRecord.preferences,
                source: 'cookie-banner',
            }),
        });
    } catch {
        // Consent UX should not fail on logging issues.
    }

    return nextRecord;
}

export function createConsentRecord(
    status: ConsentStatus,
    preferences: Partial<Omit<ConsentPreferences, 'essential'>> = {}
): Omit<ConsentRecord, 'updatedAt'> {
    const current = readConsent();

    return {
        consentId: current?.consentId || createConsentId(),
        status,
        preferences: {
            essential: true,
            analytics: Boolean(preferences.analytics),
            marketing: Boolean(preferences.marketing),
        },
    };
}
