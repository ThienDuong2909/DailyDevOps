'use client';

import Link from 'next/link';

export function BlogHeader() {
    return (
        <header className="sticky top-0 z-50 bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="layout-container flex justify-center w-full">
                <div className="flex max-w-[1280px] w-full items-center justify-between px-4 py-3 md:px-10">
                    {/* Logo & Brand */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-3 text-text-main dark:text-white group">
                            <div className="size-8 text-primary">
                                <span className="material-symbols-outlined !text-[32px]">cloud_circle</span>
                            </div>
                            <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] group-hover:text-primary transition-colors">
                                DevOps Daily
                            </h2>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                            <Link
                                href="/blog"
                                className="text-sm font-medium hover:text-primary transition-colors dark:text-gray-300"
                            >
                                Articles
                            </Link>
                            <Link
                                href="/tutorials"
                                className="text-sm font-medium hover:text-primary transition-colors dark:text-gray-300"
                            >
                                Tutorials
                            </Link>
                            <Link
                                href="/tools"
                                className="text-sm font-medium hover:text-primary transition-colors dark:text-gray-300"
                            >
                                Tools
                            </Link>
                            <Link
                                href="/about"
                                className="text-sm font-medium hover:text-primary transition-colors dark:text-gray-300"
                            >
                                About
                            </Link>
                        </nav>
                    </div>

                    {/* Search & Subscribe */}
                    <div className="flex flex-1 justify-end gap-4 items-center">
                        <label className="hidden sm:flex flex-col min-w-40 h-10 max-w-64 relative group">
                            <div className="flex w-full flex-1 items-center rounded-lg bg-background-light dark:bg-background-dark border border-transparent group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all overflow-hidden">
                                <div className="pl-3 pr-2 text-text-sub flex items-center justify-center">
                                    <span className="material-symbols-outlined !text-[20px]">search</span>
                                </div>
                                <input
                                    className="flex w-full flex-1 bg-transparent border-none focus:ring-0 text-sm font-normal text-text-main dark:text-white placeholder:text-text-sub h-full px-0"
                                    placeholder="Search..."
                                />
                            </div>
                        </label>
                        <button className="flex items-center justify-center rounded-lg h-10 px-5 bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-md shadow-primary/20 transition-all active:scale-95">
                            Subscribe
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
