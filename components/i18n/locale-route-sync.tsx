'use client';

import { useEffect } from 'react';
import type { SiteLocale } from '@/lib/i18n/config';
import { useLocaleRoute } from './locale-route-provider';

type LocaleAlternateMap = Partial<Record<SiteLocale, string>>;

export function LocaleRouteSync({
    alternates,
}: {
    alternates: LocaleAlternateMap;
}) {
    const { setAlternatePaths, clearAlternatePaths } = useLocaleRoute();

    useEffect(() => {
        setAlternatePaths(alternates);
        return () => clearAlternatePaths();
    }, [alternates, clearAlternatePaths, setAlternatePaths]);

    return null;
}
