"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

import { HeaderAuthButton } from "@/components/auth/header-auth-button";
import { useDictionary, useLocale } from "@/components/i18n/locale-provider";
import { useLocaleRoute } from "@/components/i18n/locale-route-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { apiClient } from "@/lib/api";
import type { SiteLocale } from "@/lib/i18n/config";
import { LOCALE_COOKIE_NAME, withLocale } from "@/lib/i18n/config";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { getImageUrl } from "@/lib/utils";

type SearchSuggestion = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type HeaderDictionary = ReturnType<typeof useDictionary>;

function createSearchDestination(query: string, locale: SiteLocale) {
  const trimmed = query.trim();
  return trimmed
    ? `${withLocale("/blog", locale)}?q=${encodeURIComponent(trimmed)}`
    : withLocale("/blog", locale);
}

function createLocaleDestination(
  nextLocale: SiteLocale,
  pathname: string | null,
  alternatePaths: Partial<Record<SiteLocale, string>>,
) {
  return (
    alternatePaths[nextLocale] ||
    (pathname ? withLocale(pathname, nextLocale) : withLocale("/", nextLocale))
  );
}

function useHeaderSuggestions(locale: SiteLocale, searchQuery: string) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true);
        const response = await apiClient.get<{ data?: SearchSuggestion[] }>(
          `/api/v1/posts/autocomplete?q=${encodeURIComponent(trimmed)}&limit=5&locale=${locale}`,
        );

        if (!isMounted) {
          return;
        }

        setSuggestions(response?.data || []);
      } catch {
        if (isMounted) {
          setSuggestions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingSuggestions(false);
        }
      }
    }, 220);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [locale, searchQuery]);

  return {
    suggestions,
    isLoadingSuggestions,
  };
}

function LocaleSwitch({
  locale,
  switchLocale,
  mobile = false,
}: Readonly<{
  locale: SiteLocale;
  switchLocale: (nextLocale: SiteLocale) => void;
  mobile?: boolean;
}>) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const locales: { code: SiteLocale; flag: string; label: string }[] = [
    { code: "vi", flag: "🇻🇳", label: "Tiếng Việt" },
    { code: "en", flag: "🇺🇸", label: "English" },
  ];

  const currentLocale = locales.find((l) => l.code === locale) || locales[0];

  if (mobile) {
    return (
      <div className="mb-2 flex items-center gap-2 rounded-xl border border-gray-200 p-1 dark:border-gray-700">
        {locales.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => switchLocale(l.code)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${locale === l.code ? "bg-primary text-white" : "text-text-sub"}`}
          >
            {l.flag} {l.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-1.5 rounded-2xl border px-3 text-sm font-semibold transition-all active:scale-95 theme-panel-muted theme-border-ghost text-[color:var(--text-muted-theme)] hover:text-[color:var(--text-main-theme)]"
        aria-label="Switch language"
        title={`Language: ${currentLocale.label}`}
      >
        <span className="material-symbols-outlined !text-[20px]">language</span>
        <span className="text-xs">{currentLocale.flag}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border shadow-xl theme-panel theme-border animate-in fade-in slide-in-from-top-1 duration-150">
          {locales.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                switchLocale(l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors ${
                locale === l.code
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-[color:var(--text-main-theme)] hover:bg-primary/5"
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span>{l.label}</span>
              {locale === l.code && (
                <span className="material-symbols-outlined ml-auto !text-[16px] text-primary">
                  check
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchSuggestionsPanel({
  showSuggestions,
  searchQuery,
  isLoadingSuggestions,
  suggestions,
  dictionary,
  handleSuggestionSelect,
}: Readonly<{
  showSuggestions: boolean;
  searchQuery: string;
  isLoadingSuggestions: boolean;
  suggestions: SearchSuggestion[];
  dictionary: HeaderDictionary;
  handleSuggestionSelect: (slug: string) => void;
}>) {
  if (!showSuggestions || !searchQuery.trim()) {
    return null;
  }

  return (
    <div className="theme-panel theme-border absolute top-12 z-50 w-full overflow-hidden rounded-2xl border shadow-2xl">
      {isLoadingSuggestions ? (
        <div className="px-4 py-3 text-sm theme-muted">
          {dictionary.blog.suggestionsLoading}
        </div>
      ) : suggestions.length === 0 ? (
        <button
          type="submit"
          className="block w-full px-4 py-3 text-left text-sm theme-muted transition-colors hover:bg-primary/5 hover:text-primary"
        >
          {dictionary.blog.searchLibraryFor} &quot;
          {searchQuery.trim()}&quot;
        </button>
      ) : (
        <>
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSuggestionSelect(item.slug)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/5"
            >
              <div className="theme-panel-muted theme-border flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
                {item.featuredImage ? (
                  <img
                    src={getImageUrl(item.featuredImage)}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-primary">
                    article
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[color:var(--text-main-theme)]">
                  {item.title}
                </p>
                {item.category ? (
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {item.category.name}
                  </p>
                ) : null}
                {item.excerpt ? (
                  <p className="theme-muted mt-1 line-clamp-2 text-xs">
                    {item.excerpt}
                  </p>
                ) : null}
              </div>
            </button>
          ))}
          <button
            type="submit"
            className="theme-border block w-full border-t px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/5"
          >
            {dictionary.blog.viewAllResults}
          </button>
        </>
      )}
    </div>
  );
}

function MobileHeaderMenu({
  mobileMenuOpen,
  handleSearchSubmit,
  searchQuery,
  setSearchQuery,
  dictionary,
  locale,
  switchLocale,
  navigation,
}: Readonly<{
  mobileMenuOpen: boolean;
  handleSearchSubmit: (event: React.SyntheticEvent<HTMLFormElement>) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  dictionary: HeaderDictionary;
  locale: SiteLocale;
  switchLocale: (nextLocale: SiteLocale) => void;
  navigation: Array<{ href: string; label: string }>;
}>) {
  if (!mobileMenuOpen) {
    return null;
  }

  return (
    <div className="absolute left-0 right-0 top-full animate-in slide-in-from-top-2 border-b border-gray-200 bg-surface-light/95 px-4 py-4 shadow-lg backdrop-blur-md dark:border-gray-800 dark:bg-surface-dark/95 md:hidden">
      <form
        onSubmit={handleSearchSubmit}
        className="mb-4 flex items-center gap-2"
      >
        <input
          className="theme-input h-11 flex-1 rounded-xl px-4 text-sm"
          placeholder={dictionary.blog.searchPlaceholder}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
        >
          {dictionary.common.search}
        </button>
      </form>

      <nav className="flex flex-col gap-2">
        <LocaleSwitch locale={locale} switchLocale={switchLocale} mobile />
        {navigation.map((item) => (
          <Link
            key={`mobile-${item.href}-${item.label}`}
            href={withLocale(item.href, locale)}
            className="rounded-xl px-3 py-3 text-sm font-medium text-text-main transition-colors hover:bg-primary/10 hover:text-primary dark:text-white"
          >
            {item.label}
          </Link>
        ))}
        <Link
          href={withLocale("/blog", locale)}
          className="rounded-xl px-3 py-3 text-sm font-medium text-text-main transition-colors hover:bg-primary/10 hover:text-primary dark:text-white"
        >
          {dictionary.common.allArticles}
        </Link>
      </nav>
    </div>
  );
}

function DesktopSearchForm({
  containerRef,
  desktopSearchInputRef,
  handleSearchSubmit,
  dictionary,
  searchQuery,
  setSearchQuery,
  setShowSuggestions,
  showSuggestions,
  isLoadingSuggestions,
  suggestions,
  handleSuggestionSelect,
}: Readonly<{
  containerRef: React.RefObject<HTMLFormElement | null>;
  desktopSearchInputRef: React.RefObject<HTMLInputElement | null>;
  handleSearchSubmit: (event: React.SyntheticEvent<HTMLFormElement>) => void;
  dictionary: HeaderDictionary;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  setShowSuggestions: (value: boolean) => void;
  showSuggestions: boolean;
  isLoadingSuggestions: boolean;
  suggestions: SearchSuggestion[];
  handleSuggestionSelect: (slug: string) => void;
}>) {
  return (
    <form
      ref={containerRef}
      onSubmit={handleSearchSubmit}
      className="group relative hidden h-10 min-w-40 max-w-64 flex-col sm:flex"
    >
      <div className="flex h-full max-w-64 items-center overflow-hidden rounded-lg border border-transparent bg-background-light transition-[max-width,border-color,box-shadow,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/20 dark:bg-background-dark">
        <button
          type="submit"
          className="flex h-full w-10 shrink-0 items-center justify-center text-text-sub transition-colors hover:text-primary"
          aria-label={dictionary.header.searchAria}
        >
          <span className="material-symbols-outlined !text-[20px]">search</span>
        </button>
        <input
          ref={desktopSearchInputRef}
          className="h-full max-w-52 min-w-0 flex-1 border-none bg-transparent pl-1 pr-3 text-sm font-normal text-text-main opacity-100 transition-[max-width,opacity,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-text-sub focus:ring-0 dark:text-white"
          placeholder={dictionary.blog.searchPlaceholder}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onFocus={() => setShowSuggestions(true)}
        />
      </div>
      <SearchSuggestionsPanel
        showSuggestions={showSuggestions}
        searchQuery={searchQuery}
        isLoadingSuggestions={isLoadingSuggestions}
        suggestions={suggestions}
        dictionary={dictionary}
        handleSuggestionSelect={handleSuggestionSelect}
      />
    </form>
  );
}

export function BlogHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { alternatePaths } = useLocaleRoute();
  const dictionary = useDictionary();
  const { settings } = useSiteSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const containerRef = useRef<HTMLFormElement | null>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement | null>(null);
  const { suggestions, isLoadingSuggestions } = useHeaderSuggestions(
    locale,
    searchQuery,
  );

  const handleSearchSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowSuggestions(false);
    router.push(createSearchDestination(searchQuery, locale));
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowSuggestions(false);
  }, [pathname]);

  const switchLocale = (nextLocale: SiteLocale) => {
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    const nextPath = createLocaleDestination(
      nextLocale,
      pathname,
      alternatePaths,
    );
    router.push(nextPath);
  };

  const handleSuggestionSelect = (slug: string) => {
    setShowSuggestions(false);
    router.push(withLocale(`/${slug}`, locale));
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-surface-light shadow-sm dark:border-gray-800 dark:bg-surface-dark">
      <div className="mx-auto flex w-full max-w-[1280px] min-w-0 items-center justify-between gap-3 px-3 py-3 sm:px-4 md:px-10">
        <div className="flex min-w-0 items-center gap-3 md:gap-8">
          <Link
            href={withLocale("/", locale)}
            className="group flex min-w-0 items-center gap-3 text-text-main transition-opacity hover:opacity-90 dark:text-white"
          >
            <img
              src="/logo.png"
              alt="Daily DevOps Logo"
              className="h-10 w-10 shrink-0 object-contain drop-shadow-sm md:h-12 md:w-12"
            />
            <h2 className="truncate text-lg font-extrabold tracking-tight sm:text-xl md:text-2xl">
              <span className="text-slate-800 dark:text-slate-100 transition-colors">
                Daily
              </span>{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-cyan-400 dark:to-blue-500">
                DevOps
              </span>
            </h2>
          </Link>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {settings.content.headerNavigation.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={withLocale(item.href, locale)}
                className="text-sm font-medium hover:text-primary transition-colors dark:text-gray-300"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex min-w-0 shrink-0 items-center justify-end gap-2 sm:gap-3 md:gap-4">
          <DesktopSearchForm
            containerRef={containerRef}
            desktopSearchInputRef={desktopSearchInputRef}
            handleSearchSubmit={handleSearchSubmit}
            dictionary={dictionary}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setShowSuggestions={setShowSuggestions}
            showSuggestions={showSuggestions}
            isLoadingSuggestions={isLoadingSuggestions}
            suggestions={suggestions}
            handleSuggestionSelect={handleSuggestionSelect}
          />
          <button
            type="button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-text-main transition-colors hover:border-primary hover:text-primary dark:border-gray-700 dark:text-white md:hidden"
            aria-label={
              mobileMenuOpen
                ? dictionary.header.closeMenu
                : dictionary.header.openMenu
            }
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
          <LocaleSwitch locale={locale} switchLocale={switchLocale} />
          <ThemeToggle />
          <HeaderAuthButton />
        </div>
      </div>
      <MobileHeaderMenu
        mobileMenuOpen={mobileMenuOpen}
        handleSearchSubmit={handleSearchSubmit}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dictionary={dictionary}
        locale={locale}
        switchLocale={switchLocale}
        navigation={settings.content.headerNavigation}
      />
    </header>
  );
}
