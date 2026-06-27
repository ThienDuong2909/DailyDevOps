"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getAdminPageTitle } from "@/components/layout/admin-navigation";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: Readonly<AdminHeaderProps>) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const title = getAdminPageTitle(pathname);

  return (
    <header className="theme-surface flex h-16 shrink-0 items-center justify-between gap-3 border-b px-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Open admin navigation"
          className="theme-panel-muted theme-border inline-flex size-10 items-center justify-center rounded-2xl border text-[color:var(--text-muted-theme)] transition-colors hover:text-[color:var(--text-main-theme)] lg:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="min-w-0">
          <p className="theme-soft hidden text-[11px] font-semibold uppercase tracking-[0.18em] sm:block">
            Admin
          </p>
          <p className="truncate text-lg font-bold leading-tight tracking-tight text-[color:var(--text-main-theme)]">
            {title}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
        <div className="theme-input hidden h-10 w-64 items-center rounded-2xl px-3 transition-colors xl:flex">
          <span className="material-symbols-outlined theme-soft text-[20px]">
            search
          </span>
          <input
            className="w-full border-none bg-transparent text-sm text-[color:var(--text-main-theme)] placeholder-[color:var(--text-soft-theme)] focus:ring-0"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search articles, users..."
            type="text"
            value={searchQuery}
          />
        </div>

        <ThemeToggle />
        <button
          aria-label="Notifications"
          className="theme-panel-muted relative flex size-10 items-center justify-center rounded-2xl border text-[color:var(--text-muted-theme)] transition-colors hover:text-[color:var(--text-main-theme)]"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">
            notifications
          </span>
          <span className="absolute right-2 top-2 size-2 rounded-full border border-[color:var(--surface-elevated)] bg-[#fa6238]" />
        </button>
        <Link
          className="theme-glow-button hidden h-10 items-center gap-2 rounded-2xl px-4 text-sm font-bold transition-opacity hover:opacity-95 sm:flex"
          href="/admin/articles/new"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Post</span>
        </Link>
      </div>
    </header>
  );
}
