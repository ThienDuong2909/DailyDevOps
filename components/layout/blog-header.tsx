'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';

import { HeaderAuthButton } from '@/components/auth/header-auth-button';
import { useDictionary, useLocale } from '@/components/i18n/locale-provider';
import { useLocaleRoute } from '@/components/i18n/locale-route-provider';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { apiClient } from '@/lib/api';
import type { SiteLocale } from '@/lib/i18n/config';
import { LOCALE_COOKIE_NAME, withLocale } from '@/lib/i18n/config';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { getImageUrl } from '@/lib/utils';

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

export function BlogHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const { alternatePaths } = useLocaleRoute();
    const dictionary = useDictionary();
    const { settings } = useSiteSettings();
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const containerRef = useRef<HTMLFormElement | null>(null);
    const desktopSearchInputRef = useRef<HTMLInputElement | null>(null);

    const handleSearchSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = searchQuery.trim();
        const destination = trimmed
            ? `${withLocale('/blog', locale)}?q=${encodeURIComponent(trimmed)}`
            : withLocale('/blog', locale);
        setShowSuggestions(false);
        router.push(destination);
    };

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
                    `/api/v1/posts/autocomplete?q=${encodeURIComponent(trimmed)}&limit=5&locale=${locale}`
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

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
        setShowSuggestions(false);
    }, [pathname]);

    const switchLocale = (nextLocale: SiteLocale) => {
        document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        const nextPath = alternatePaths[nextLocale] || (pathname ? withLocale(pathname, nextLocale) : withLocale('/', nextLocale));
        router.push(nextPath);
    };

    const handleSuggestionSelect = (slug: string) => {
        setShowSuggestions(false);
        router.push(withLocale(`/${slug}`, locale));
    };

    return (
        <header className="sticky top-0 z-50 overflow-x-clip border-b border-gray-200 bg-surface-light shadow-sm dark:border-gray-800 dark:bg-surface-dark">
            <div className="mx-auto flex w-full max-w-[1280px] min-w-0 items-center justify-between gap-3 px-3 py-3 sm:px-4 md:px-10">
                    <div className="flex min-w-0 items-center gap-3 md:gap-8">
                        <Link href={withLocale('/', locale)} className="group flex min-w-0 items-center gap-3 text-text-main transition-opacity hover:opacity-90 dark:text-white">
                            <img 
                                src="/logo.png" 
                                alt="Daily DevOps Logo" 
                                className="h-10 w-10 shrink-0 object-contain drop-shadow-sm md:h-12 md:w-12" 
                            />
                            <h2 className="truncate text-lg font-extrabold tracking-tight sm:text-xl md:text-2xl">
                                <span className="text-slate-800 dark:text-slate-100 transition-colors">Daily</span>{" "}
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
                        <form
                            ref={containerRef}
                            onSubmit={handleSearchSubmit}
                            className="relative hidden h-10 flex-col group sm:flex min-w-40 max-w-64"
                        >
                                <div
                                    className="flex h-full items-center overflow-hidden rounded-lg border bg-background-light transition-[max-width,border-color,box-shadow,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-background-dark max-w-64 border-transparent group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/20"
                                >
                                <button
                                    type="submit"
                                    className="flex h-full w-10 shrink-0 items-center justify-center text-text-sub transition-colors hover:text-primary"
                                    aria-label={dictionary.header.searchAria}
                                >
                                    <span className="material-symbols-outlined !text-[20px]">search</span>
                                </button>
                                <input
                                    ref={desktopSearchInputRef}
                                    className="h-full min-w-0 border-none bg-transparent text-sm font-normal text-text-main placeholder:text-text-sub transition-[max-width,opacity,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:ring-0 dark:text-white max-w-52 flex-1 pl-1 pr-3 opacity-100"
                                    placeholder={dictionary.blog.searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                />
                            </div>
                            {showSuggestions && searchQuery.trim() ? (
                                <div className="theme-panel theme-border absolute top-12 z-50 w-full overflow-hidden rounded-2xl border shadow-2xl">
                                    {isLoadingSuggestions ? (
                                        <div className="px-4 py-3 text-sm theme-muted">{dictionary.blog.suggestionsLoading}</div>
                                    ) : suggestions.length === 0 ? (
                                        <button
                                            type="submit"
                                            className="block w-full px-4 py-3 text-left text-sm theme-muted transition-colors hover:bg-primary/5 hover:text-primary"
                                        >
                                            {dictionary.blog.searchLibraryFor} &quot;{searchQuery.trim()}&quot;
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
                                                            <span className="material-symbols-outlined text-primary">article</span>
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
                            ) : null}
                        </form>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen((value) => !value)}
                            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-text-main transition-colors hover:border-primary hover:text-primary dark:border-gray-700 dark:text-white md:hidden"
                            aria-label={mobileMenuOpen ? dictionary.header.closeMenu : dictionary.header.openMenu}
                        >
                            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                        </button>
                        <div className="hidden items-center gap-1 rounded-lg border border-gray-200 px-1 py-1 dark:border-gray-700 sm:flex">
                            <button
                                type="button"
                                onClick={() => switchLocale('vi')}
                                className={`rounded-md px-2 py-1 text-xs font-semibold ${locale === 'vi' ? 'bg-primary text-white' : 'text-text-sub'}`}
                            >
                                {dictionary.header.languageVi}
                            </button>
                            <button
                                type="button"
                                onClick={() => switchLocale('en')}
                                className={`rounded-md px-2 py-1 text-xs font-semibold ${locale === 'en' ? 'bg-primary text-white' : 'text-text-sub'}`}
                            >
                                {dictionary.header.languageEn}
                            </button>
                        </div>
                        <ThemeToggle />
                        <HeaderAuthButton />
                    </div>
            </div>
            {mobileMenuOpen ? (
                <div className="absolute left-0 right-0 top-full border-b border-gray-200 bg-surface-light/95 backdrop-blur-md px-4 py-4 shadow-lg dark:border-gray-800 dark:bg-surface-dark/95 md:hidden animate-in slide-in-from-top-2">
                    <form onSubmit={handleSearchSubmit} className="mb-4 flex items-center gap-2">
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
                        <div className="mb-2 flex items-center gap-2 rounded-xl border border-gray-200 p-1 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => switchLocale('vi')}
                                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${locale === 'vi' ? 'bg-primary text-white' : 'text-text-sub'}`}
                            >
                                {dictionary.header.languageVi}
                            </button>
                            <button
                                type="button"
                                onClick={() => switchLocale('en')}
                                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${locale === 'en' ? 'bg-primary text-white' : 'text-text-sub'}`}
                            >
                                {dictionary.header.languageEn}
                            </button>
                        </div>
                        {settings.content.headerNavigation.map((item) => (
                            <Link
                                key={`mobile-${item.href}-${item.label}`}
                                href={withLocale(item.href, locale)}
                                className="rounded-xl px-3 py-3 text-sm font-medium text-text-main transition-colors hover:bg-primary/10 hover:text-primary dark:text-white"
                            >
                                {item.label}
                            </Link>
                        ))}
                        <Link
                            href={withLocale('/blog', locale)}
                            className="rounded-xl px-3 py-3 text-sm font-medium text-text-main transition-colors hover:bg-primary/10 hover:text-primary dark:text-white"
                        >
                            {dictionary.common.allArticles}
                        </Link>
                    </nav>
                </div>
            ) : null}
        </header>
    );
}
