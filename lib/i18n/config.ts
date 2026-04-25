export const SUPPORTED_LOCALES = ["vi", "en"] as const;
export type SiteLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SiteLocale = "vi";
export const LOCALE_COOKIE_NAME = "preferred_locale";

export function isSupportedLocale(
  value: string | null | undefined,
): value is SiteLocale {
  return SUPPORTED_LOCALES.includes((value || "").toLowerCase() as SiteLocale);
}

export function normalizeLocale(value: string | null | undefined): SiteLocale {
  return isSupportedLocale(value)
    ? (value.toLowerCase() as SiteLocale)
    : DEFAULT_LOCALE;
}

export function stripLocaleFromPath(pathname: string): string {
  if (!pathname) {
    return "/";
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return "/";
  }

  if (isSupportedLocale(segments[0])) {
    const remaining = segments.slice(1);
    if (remaining.length === 0) {
      return "/";
    }
    const joined = `/${remaining.join("/")}`;
    // Strip trailing slash without regex
    return joined.length > 1 && joined.endsWith("/")
      ? joined.slice(0, -1)
      : joined;
  }

  return pathname;
}

export function withLocale(pathname: string, locale: SiteLocale): string {
  const normalizedPath = stripLocaleFromPath(pathname || "/");
  if (normalizedPath === "/") {
    return `/${locale}`;
  }

  const localizedPath = normalizedPath.startsWith("/")
    ? normalizedPath
    : `/${normalizedPath}`;
  return `/${locale}${localizedPath}`;
}
