'use client';

import { useState, useEffect } from 'react';

export function ThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

    useEffect(() => {
        // Lấy theme hiện tại từ localStorage hoặc từ DOM (nếu được set bởi script chống FOUC)
        const isDark = document.documentElement.classList.contains('dark');
        setTheme(isDark ? 'dark' : 'light');
    }, []);

    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    const toggleTheme = () => {
        const newTheme = nextTheme;
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Đợi Hydration xong mới render icon để tránh báo lỗi lệch giao diện SSR
    if (!theme) return <div className="size-10" />;

    return (
        <button
            onClick={toggleTheme}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition-all active:scale-95 theme-panel-muted theme-border-ghost text-[color:var(--text-muted-theme)] hover:text-[color:var(--text-main-theme)]"
            aria-label="Toggle Dark Mode"
            title={nextTheme === 'light' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            <span className="material-symbols-outlined !text-[20px]">
                {nextTheme === 'light' ? 'light_mode' : 'dark_mode'}
            </span>
            <span className="hidden sm:inline">{nextTheme === 'light' ? 'Light' : 'Dark'}</span>
        </button>
    );
}
