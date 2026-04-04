'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface AdminHeaderProps {
    title: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <header className="theme-surface flex h-16 shrink-0 items-center justify-between border-b px-6 lg:px-10">
            <div className="flex items-center gap-4">
                <button className="theme-muted lg:hidden">
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <h2 className="text-lg font-bold leading-tight tracking-tight text-[color:var(--text-main-theme)]">{title}</h2>
            </div>

            <div className="flex items-center gap-6">
                <div className="theme-input hidden h-10 w-64 items-center rounded-2xl px-3 transition-colors md:flex">
                    <span className="material-symbols-outlined theme-soft text-[20px]">search</span>
                    <input
                        className="w-full border-none bg-transparent text-sm text-[color:var(--text-main-theme)] placeholder-[color:var(--text-soft-theme)] focus:ring-0"
                        placeholder="Search logs, articles, users..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <button className="theme-panel-muted relative flex size-10 items-center justify-center rounded-2xl border text-[color:var(--text-muted-theme)] transition-colors hover:text-[color:var(--text-main-theme)]">
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                        <span className="absolute right-2 top-2 size-2 rounded-full border border-[color:var(--surface-elevated)] bg-[#fa6238]" />
                    </button>
                    <Link
                        href="/admin/articles/new"
                        className="theme-glow-button flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-bold transition-opacity hover:opacity-95"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        <span className="hidden sm:inline">New Post</span>
                    </Link>
                </div>
            </div>
        </header>
    );
}
