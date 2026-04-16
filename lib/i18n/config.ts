export const SUPPORTED_LOCALES = ['vi', 'en'] as const;
export type SiteLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SiteLocale = 'vi';
export const LOCALE_COOKIE_NAME = 'preferred_locale';

export function isSupportedLocale(value: string | null | undefined): value is SiteLocale {
    return SUPPORTED_LOCALES.includes((value || '').toLowerCase() as SiteLocale);
}

export function normalizeLocale(value: string | null | undefined): SiteLocale {
    return isSupportedLocale(value) ? (value.toLowerCase() as SiteLocale) : DEFAULT_LOCALE;
}

export function stripLocaleFromPath(pathname: string): string {
    if (!pathname) {
        return '/';
    }

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
        return '/';
    }

    if (isSupportedLocale(segments[0])) {
        const next = `/${segments.slice(1).join('/')}`;
        return next === '/' ? '/' : next.replace(/\/+$/, '') || '/';
    }

    return pathname;
}

export function withLocale(pathname: string, locale: SiteLocale): string {
    const normalizedPath = stripLocaleFromPath(pathname || '/');
    if (normalizedPath === '/') {
        return `/${locale}`;
    }

    return `/${locale}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
}
