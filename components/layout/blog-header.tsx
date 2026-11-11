"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search } from "lucide-react";

import { HeaderAuthButton } from "@/components/auth/header-auth-button";
import { useDictionary, useLocale } from "@/components/i18n/locale-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { SiteLocale } from "@/lib/i18n/config";
import { withLocale } from "@/lib/i18n/config";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { CommandPaletteModal } from "@/components/search/command-palette-modal";
import { loadSearchIndex } from "@/lib/search/search-engine";

type HeaderDictionary = ReturnType<typeof useDictionary>;

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
  const otherLocale = locales.find((l) => l.code !== locale) || locales[1];

  if (mobile) {
    return (
      <div className="mb-2 flex items-center gap-2 rounded-xl border border-gray-200 p-1 dark:border-gray-700">
        {locales.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => switchLocale(l.code)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
              locale === l.code ? "bg-primary text-white" : "text-text-sub"
            }`}
            aria-label={`Switch to ${l.label}`}
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
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-lg transition-colors hover:border-primary hover:text-primary dark:border-gray-700 dark:hover:border-primary"
        aria-label="Switch language"
        title={`Language: ${currentLocale.label}`}
      >
        {currentLocale.flag}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border shadow-xl theme-panel theme-border animate-in fade-in slide-in-from-top-1 duration-150">
          <button
            type="button"
            onClick={() => {
              switchLocale(otherLocale.code);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-[color:var(--text-main-theme)] transition-colors hover:bg-primary/5"
          >
            <span className="text-base">{otherLocale.flag}</span>
            <span>{otherLocale.label}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function MobileHeaderMenu({
  mobileMenuOpen,
  onOpenSearch,
  dictionary,
  locale,
  switchLocale,
  navigation,
}: Readonly<{
  mobileMenuOpen: boolean;
  onOpenSearch: () => void;
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
      <button
        type="button"
        onClick={onOpenSearch}
        className="mb-4 flex h-11 w-full items-center gap-2.5 rounded-xl border border-[var(--border-soft-theme)] bg-[var(--surface-muted)] px-3 text-left text-sm text-[var(--text-soft-theme)]"
      >
        <Search className="size-4 shrink-0 text-[var(--primary-theme)]" />
        <span className="flex-1 truncate">
          {dictionary.blog.searchPlaceholder || "Tìm kiếm bài viết..."}
        </span>
        <kbd className="rounded border border-[var(--border-soft-theme)] bg-[var(--surface-elevated)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-muted-theme)]">
          Ctrl K
        </kbd>
      </button>

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
          href={withLocale("/category", locale)}
          className="rounded-xl px-3 py-3 text-sm font-medium text-text-main transition-colors hover:bg-primary/10 hover:text-primary dark:text-white"
        >
          {dictionary.common.allArticles}
        </Link>
      </nav>
    </div>
  );
}

export function BlogHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const dictionary = useDictionary();
  const { settings } = useSiteSettings();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Global Ctrl+K / Cmd+K keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const switchLocale = (nextLocale: SiteLocale) => {
    if (nextLocale === locale) return;
    const currentSegments = (pathname || "")
      .replace(/^\/(vi|en)(?=\/|$)/, "")
      .replace(/^\/+/, "");
    const targetUrl = withLocale(`/${currentSegments}`, nextLocale);
    router.push(targetUrl);
  };

  const handleOpenPalette = () => {
    setMobileMenuOpen(false);
    setIsPaletteOpen(true);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 bg-surface-light/80 backdrop-blur-md dark:border-gray-800/80 dark:bg-surface-dark/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link
            href={withLocale("/", locale)}
            className="group flex min-w-0 items-center gap-3 text-text-main transition-opacity hover:opacity-90 dark:text-white"
          >
            <img
              src="/logo.png"
              alt="Daily DevOps Logo"
              className="h-9 w-9 shrink-0 object-contain drop-shadow-sm md:h-10 md:w-10"
            />
            <h2 className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
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
          {/* Command Palette Trigger Button (Desktop & Tablet) */}
          <button
            type="button"
            onClick={handleOpenPalette}
            onMouseEnter={() => loadSearchIndex(locale)}
            className="group relative flex h-10 items-center gap-2 rounded-xl border border-[var(--border-soft-theme)] bg-[var(--surface-muted)] px-3 text-left transition-all hover:border-[var(--primary-theme)] hover:bg-[var(--surface-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-theme)]/20 sm:w-44 md:w-56"
            aria-label="Tìm kiếm (Ctrl + K)"
          >
            <Search className="size-4 shrink-0 text-[var(--text-soft-theme)] transition-colors group-hover:text-[var(--primary-theme)]" />
            <span className="flex-1 truncate text-xs font-normal text-[var(--text-soft-theme)] group-hover:text-[var(--text-main-theme)]">
              {locale === "vi" ? "Tìm kiếm..." : "Search..."}
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-[var(--border-soft-theme)] bg-[var(--surface-elevated)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-muted-theme)] shadow-xs">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </button>

          {/* Mobile Menu Button */}
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
        onOpenSearch={handleOpenPalette}
        dictionary={dictionary}
        locale={locale}
        switchLocale={switchLocale}
        navigation={settings.content.headerNavigation}
      />

      {/* Global Command Palette Modal */}
      <CommandPaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        locale={locale}
      />
    </header>
  );
}
