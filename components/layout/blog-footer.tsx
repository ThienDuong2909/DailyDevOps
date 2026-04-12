'use client';

import Link from 'next/link';
import { useSiteSettings } from '@/hooks/use-site-settings';

export function BlogFooter() {
    const { settings } = useSiteSettings();

    return (
        <footer className="theme-surface mt-10 w-full border-t">
            <div className="layout-container flex justify-center w-full">
                <div className="flex flex-col max-w-[1280px] w-full px-4 py-10 md:px-10">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                        <div className="flex flex-col gap-4 max-w-xs">
                            <div className="flex items-center gap-2 text-[color:var(--text-main-theme)]">
                                <div className="size-6 text-primary">
                                    <span className="material-symbols-outlined">cloud_circle</span>
                                </div>
                                <h3 className="font-bold text-lg">{settings.general.siteName}</h3>
                            </div>
                            <p className="theme-muted text-sm">
                                {settings.content.footerDescription}
                            </p>
                            <div className="flex gap-4 mt-2">
                                <Link href="/about" className="theme-muted hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">public</span>
                                </Link>
                                <Link href="/newsletter" className="theme-muted hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">alternate_email</span>
                                </Link>
                                <Link href="/rss.xml" className="theme-muted hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">rss_feed</span>
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 md:flex md:gap-20">
                            <div className="flex flex-col gap-3">
                                <h4 className="text-sm font-bold text-[color:var(--text-main-theme)]">Content</h4>
                                {settings.content.footerContentLinks.map((item) => (
                                    <Link key={`${item.href}-${item.label}`} href={item.href} className="theme-muted text-sm hover:text-primary transition-colors">
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                            <div className="flex flex-col gap-3">
                                <h4 className="text-sm font-bold text-[color:var(--text-main-theme)]">Company</h4>
                                {settings.content.footerCompanyLinks.map((item) => (
                                    <Link key={`${item.href}-${item.label}`} href={item.href} className="theme-muted text-sm hover:text-primary transition-colors">
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="theme-border my-8 h-px w-full bg-transparent" />

                    <div className="theme-muted flex flex-col items-center justify-between gap-4 text-sm sm:flex-row">
                        <p>© 2024 DevOps Daily. All rights reserved.</p>
                        <p className="flex items-center gap-1">
                            Made with{' '}
                            <span className="material-symbols-outlined !text-[16px] text-red-500">favorite</span>{' '}
                            for the community
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
