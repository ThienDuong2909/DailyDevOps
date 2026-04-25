"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { SiteLocale } from "@/lib/i18n/config";

type LocaleAlternateMap = Partial<Record<SiteLocale, string>>;

type LocaleRouteContextValue = {
  alternatePaths: LocaleAlternateMap;
  setAlternatePaths: (paths: LocaleAlternateMap) => void;
  clearAlternatePaths: () => void;
};

const LocaleRouteContext = createContext<LocaleRouteContextValue | null>(null);

export function LocaleRouteProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [alternatePaths, setAlternatePaths] = useState<LocaleAlternateMap>({});

  const clearAlternatePaths = useCallback(() => {
    setAlternatePaths({});
  }, []);

  const value = useMemo(
    () => ({
      alternatePaths,
      setAlternatePaths,
      clearAlternatePaths,
    }),
    [alternatePaths, clearAlternatePaths, setAlternatePaths],
  );

  return (
    <LocaleRouteContext.Provider value={value}>
      {children}
    </LocaleRouteContext.Provider>
  );
}

export function useLocaleRoute() {
  const context = useContext(LocaleRouteContext);

  if (!context) {
    const noop = () => undefined;
    return {
      alternatePaths: {},
      setAlternatePaths: noop,
      clearAlternatePaths: noop,
    };
  }

  return context;
}
