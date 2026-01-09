'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AdminHeaderProps {
    title: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <header className="h-16 flex items-center justify-between px-6 lg:px-10 border-b border-border-dark bg-[#111418] shrink-0">
            <div className="flex items-center gap-4">
                <button className="lg:hidden text-white">
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <h2 className="text-white text-lg font-bold leading-tight tracking-tight">{title}</h2>
            </div>

            <div className="flex items-center gap-6">
                {/* Search */}
                <div className="hidden md:flex items-center bg-[#283039] rounded-lg h-9 w-64 px-3 border border-transparent focus-within:border-primary/50 transition-colors">
                    <span className="material-symbols-outlined text-[#9dabb9] text-[20px]">search</span>
                    <input
                        className="bg-transparent border-none text-sm text-white placeholder-[#9dabb9] w-full focus:ring-0"
                        placeholder="Search logs, articles, users..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button className="flex items-center justify-center size-9 rounded-lg bg-[#283039] text-[#9dabb9] hover:text-white hover:bg-[#3b4754] transition-colors relative">
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                        <span className="absolute top-2 right-2 size-2 bg-[#fa6238] rounded-full border border-[#283039]" />
                    </button>
                    <Link
                        href="/admin/articles/new"
                        className="flex items-center gap-2 h-9 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        <span className="hidden sm:inline">New Post</span>
                    </Link>
                </div>
            </div>
        </header>
    );
}
