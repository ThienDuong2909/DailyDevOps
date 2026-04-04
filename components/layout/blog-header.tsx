'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    const { settings } = useSiteSettings();
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLFormElement | null>(null);

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = searchQuery.trim();

        if (!trimmed) {
            router.push('/search');
            return;
        }

        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
        setShowSuggestions(false);
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
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
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
                            className="hidden sm:flex flex-col min-w-40 h-10 max-w-64 relative group"
                        >
                            <div className="flex w-full flex-1 items-center rounded-lg bg-background-light dark:bg-background-dark border border-transparent group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all overflow-hidden">
                                <div className="pl-3 pr-2 text-text-sub flex items-center justify-center">
                                    <span className="material-symbols-outlined !text-[20px]">search</span>
                                </div>
                                <input
                                    className="flex w-full flex-1 bg-transparent border-none focus:ring-0 text-sm font-normal text-text-main dark:text-white placeholder:text-text-sub h-full px-0"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                />
                            </div>
                            {showSuggestions && searchQuery.trim() ? (
                                <div className="theme-panel theme-border absolute top-12 z-50 w-full overflow-hidden rounded-2xl border shadow-2xl">
                                    {isLoadingSuggestions ? (
                                        <div className="px-4 py-3 text-sm theme-muted">Dang tim goi y...</div>
                                    ) : suggestions.length === 0 ? (
                                        <button
                                            type="submit"
                                            className="block w-full px-4 py-3 text-left text-sm theme-muted transition-colors hover:bg-primary/5 hover:text-primary"
                                        >
                                            Tim kiem toan bo cho "{searchQuery.trim()}"
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
                                                Xem tat ca ket qua
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : null}
                        </form>
                        <ThemeToggle />
                        <HeaderAuthButton />
                    </div>
                </div>
            </div>
        </header>
    );
}
