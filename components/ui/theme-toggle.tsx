'use client';

import { useState, useEffect } from 'react';

export function ThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

    useEffect(() => {
        // Lấy theme hiện tại từ localStorage hoặc từ DOM (nếu được set bởi script chống FOUC)
        const isDark = document.documentElement.classList.contains('dark');
        setTheme(isDark ? 'dark' : 'light');
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
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
            className="flex items-center justify-center size-10 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-[#1a222e] dark:hover:bg-[#283039] text-text-sub dark:text-gray-300 hover:text-primary transition-all active:scale-95"
            aria-label="Toggle Dark Mode"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            <span className="material-symbols-outlined !text-[20px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
        </button>
    );
}
