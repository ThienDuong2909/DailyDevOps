'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { SiteLocale } from '@/lib/i18n/config';

type LocaleAlternateMap = Partial<Record<SiteLocale, string>>;

type LocaleRouteContextValue = {
    alternatePaths: LocaleAlternateMap;
    setAlternatePaths: (paths: LocaleAlternateMap) => void;
    clearAlternatePaths: () => void;
};

const LocaleRouteContext = createContext<LocaleRouteContextValue | null>(null);

export function LocaleRouteProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [alternatePaths, setAlternatePathsState] = useState<LocaleAlternateMap>({});

    const setAlternatePaths = useCallback((paths: LocaleAlternateMap) => {
        setAlternatePathsState(paths);
    }, []);

    const clearAlternatePaths = useCallback(() => {
        setAlternatePathsState({});
    }, []);

    const value = useMemo(
        () => ({
            alternatePaths,
            setAlternatePaths,
            clearAlternatePaths,
        }),
        [alternatePaths, clearAlternatePaths, setAlternatePaths]
    );

    return <LocaleRouteContext.Provider value={value}>{children}</LocaleRouteContext.Provider>;
}

export function useLocaleRoute() {
    const context = useContext(LocaleRouteContext);

    if (!context) {
        return {
            alternatePaths: {},
            setAlternatePaths: () => undefined,
            clearAlternatePaths: () => undefined,
        };
    }

    return context;
}
