'use client';

import { createContext, useContext, useMemo } from 'react';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';
import type { SiteLocale } from '@/lib/i18n/config';

type LocaleContextValue = {
    locale: SiteLocale;
    dictionary: ReturnType<typeof getDictionary>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
    locale,
    children,
}: {
    locale: SiteLocale;
    children: React.ReactNode;
}) {
    const value = useMemo(
        () => ({
            locale,
            dictionary: getDictionary(locale),
        }),
        [locale]
    );

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
    const context = useContext(LocaleContext);

    if (!context) {
        return DEFAULT_LOCALE;
    }

    return context.locale;
}

export function useDictionary() {
    const context = useContext(LocaleContext);

    if (!context) {
        return getDictionary(DEFAULT_LOCALE);
    }

    return context.dictionary;
}
