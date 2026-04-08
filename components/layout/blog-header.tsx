'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';

import { HeaderAuthButton } from '@/components/auth/header-auth-button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { apiClient } from '@/lib/api';
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
    const { settings } = useSiteSettings();
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isDesktopSearchExpanded, setIsDesktopSearchExpanded] = useState(pathname !== '/blog');
    const containerRef = useRef<HTMLFormElement | null>(null);
    const desktopSearchInputRef = useRef<HTMLInputElement | null>(null);
    const searchNavigationTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const isBlogListingPage = pathname === '/blog';

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = searchQuery.trim();

        if (isBlogListingPage && !isDesktopSearchExpanded) {
            setIsDesktopSearchExpanded(true);
            setShowSuggestions(true);
            requestAnimationFrame(() => desktopSearchInputRef.current?.focus());
            return;
        }

        const destination = trimmed ? `/blog?q=${encodeURIComponent(trimmed)}` : '/blog';

        setShowSuggestions(false);

        if (!isBlogListingPage) {
            setIsDesktopSearchExpanded(false);
            clearTimeout(searchNavigationTimeoutRef.current);
            searchNavigationTimeoutRef.current = setTimeout(() => {
                router.push(destination);
            }, 180);
            return;
        }

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
                    `/api/v1/posts/autocomplete?q=${encodeURIComponent(trimmed)}&limit=5`
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
    }, [searchQuery]);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setShowSuggestions(false);
                if (isBlogListingPage && !searchQuery.trim()) {
                    setIsDesktopSearchExpanded(false);
                }
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isBlogListingPage, searchQuery]);

    useEffect(() => {
        setMobileMenuOpen(false);
        setShowSuggestions(false);
        setIsDesktopSearchExpanded(pathname !== '/blog');
    }, [pathname]);

    useEffect(() => {
        return () => {
            clearTimeout(searchNavigationTimeoutRef.current);
        };
    }, []);

    const handleSuggestionSelect = (slug: string) => {
        setShowSuggestions(false);
        router.push(`/blog/${slug}`);
    };

    return (
        <header className="sticky top-0 z-50 bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="layout-container flex justify-center w-full">
                <div className="flex max-w-[1280px] w-full items-center justify-between px-4 py-3 md:px-10">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-3 text-text-main dark:text-white group">
                            <div className="size-8 text-primary">
                                <span className="material-symbols-outlined !text-[32px]">cloud_circle</span>
                            </div>
                            <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] group-hover:text-primary transition-colors">
                                {settings.general.siteName}
                            </h2>
                        </Link>

                        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                            {settings.content.headerNavigation.map((item) => (
                                <Link
                                    key={`${item.href}-${item.label}`}
                                    href={item.href}
                                    className="text-sm font-medium hover:text-primary transition-colors dark:text-gray-300"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex flex-1 justify-end gap-4 items-center">
                        <form
                            ref={containerRef}
                            onSubmit={handleSearchSubmit}
                            className={`relative hidden h-10 flex-col group sm:flex ${
                                isBlogListingPage
                                    ? 'w-full max-w-64 items-end'
                                    : 'min-w-40 max-w-64'
                            }`}
                        >
                                <div
                                    className={`flex h-full items-center overflow-hidden rounded-lg border bg-background-light transition-[max-width,border-color,box-shadow,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-background-dark ${
                                        isDesktopSearchExpanded || !isBlogListingPage
                                            ? 'max-w-64 border-transparent group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/20'
                                            : 'max-w-10 border-gray-200 dark:border-gray-700'
                                    }`}
                                >
                                <button
                                    type="submit"
                                    className="flex h-full w-10 shrink-0 items-center justify-center text-text-sub transition-colors hover:text-primary"
                                    aria-label="Search articles"
                                    onClick={() => {
                                        if (isBlogListingPage && !isDesktopSearchExpanded) {
                                            setIsDesktopSearchExpanded(true);
                                            setShowSuggestions(true);
                                            requestAnimationFrame(() => desktopSearchInputRef.current?.focus());
                                        }
                                    }}
                                >
                                    <span className="material-symbols-outlined !text-[20px]">search</span>
                                </button>
                                <input
                                    ref={desktopSearchInputRef}
                                    className={`h-full min-w-0 border-none bg-transparent text-sm font-normal text-text-main placeholder:text-text-sub transition-[max-width,opacity,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:ring-0 dark:text-white ${
                                        isDesktopSearchExpanded || !isBlogListingPage
                                            ? 'max-w-52 flex-1 pl-1 pr-3 opacity-100'
                                            : 'pointer-events-none max-w-0 flex-none pl-0 pr-0 opacity-0'
                                    }`}
                                    placeholder="Search articles, tools, and topics..."
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    onFocus={() => {
                                        setIsDesktopSearchExpanded(true);
                                        setShowSuggestions(true);
                                    }}
                                />
                            </div>
                            {showSuggestions && searchQuery.trim() && (isDesktopSearchExpanded || !isBlogListingPage) ? (
                                <div className="theme-panel theme-border absolute top-12 z-50 w-full overflow-hidden rounded-2xl border shadow-2xl">
                                    {isLoadingSuggestions ? (
                                        <div className="px-4 py-3 text-sm theme-muted">Dang tim goi y...</div>
                                    ) : suggestions.length === 0 ? (
                                        <button
                                            type="submit"
                                            className="block w-full px-4 py-3 text-left text-sm theme-muted transition-colors hover:bg-primary/5 hover:text-primary"
                                        >
                                            Search the full library for "{searchQuery.trim()}"
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
                                                View all search results
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : null}
                        </form>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen((value) => !value)}
                            className="inline-flex size-10 items-center justify-center rounded-lg border border-gray-200 text-text-main transition-colors hover:border-primary hover:text-primary dark:border-gray-700 dark:text-white md:hidden"
                            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        >
                            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                        </button>
                        <ThemeToggle />
                        <HeaderAuthButton />
                    </div>
                </div>
            </div>
            {mobileMenuOpen ? (
                <div className="border-t border-gray-200 bg-surface-light px-4 py-4 shadow-sm dark:border-gray-800 dark:bg-surface-dark md:hidden">
                    <form onSubmit={handleSearchSubmit} className="mb-4 flex items-center gap-2">
                        <input
                            className="theme-input h-11 flex-1 rounded-xl px-4 text-sm"
                            placeholder="Search articles, tools, and topics..."
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                        />
                        <button
                            type="submit"
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
                        >
                            Search
                        </button>
                    </form>

                    <nav className="flex flex-col gap-2">
                        {settings.content.headerNavigation.map((item) => (
                            <Link
                                key={`mobile-${item.href}-${item.label}`}
                                href={item.href}
                                className="rounded-xl px-3 py-3 text-sm font-medium text-text-main transition-colors hover:bg-primary/10 hover:text-primary dark:text-white"
                            >
                                {item.label}
                            </Link>
                        ))}
                        <Link
                            href="/blog"
                            className="rounded-xl px-3 py-3 text-sm font-medium text-text-main transition-colors hover:bg-primary/10 hover:text-primary dark:text-white"
                        >
                            All Articles
                        </Link>
                    </nav>
                </div>
            ) : null}
        </header>
    );
}
