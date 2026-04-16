'use client';

import Link from 'next/link';
import { useDictionary, useLocale } from '@/components/i18n/locale-provider';
import { withLocale } from '@/lib/i18n/config';
import { useSiteSettings } from '@/hooks/use-site-settings';

export function BlogFooter() {
    const locale = useLocale();
    const dictionary = useDictionary();
    const { settings } = useSiteSettings();

    return (
        <footer className="theme-surface mt-10 w-full border-t">
            <div className="layout-container flex w-full justify-center">
                <div className="flex w-full max-w-[1280px] flex-col px-4 py-10 md:px-10">
                    <div className="flex flex-col items-start justify-between gap-10 md:flex-row">
                        <div className="flex max-w-xs flex-col gap-4">
                            <div className="flex items-center gap-2 text-[color:var(--text-main-theme)]">
                                <div className="size-6 text-primary">
                                    <span className="material-symbols-outlined">cloud_circle</span>
                                </div>
                                <h3 className="text-lg font-bold">{settings.general.siteName}</h3>
                            </div>
                            <p className="theme-muted text-sm">{settings.content.footerDescription}</p>
                            <div className="mt-2 flex gap-4">
                                <Link href={withLocale('/about', locale)} className="theme-muted transition-colors hover:text-primary">
                                    <span className="material-symbols-outlined">public</span>
                                </Link>
                                <Link href={withLocale('/newsletter', locale)} className="theme-muted transition-colors hover:text-primary">
                                    <span className="material-symbols-outlined">alternate_email</span>
                                </Link>
                                <Link href="/rss.xml" className="theme-muted transition-colors hover:text-primary">
                                    <span className="material-symbols-outlined">rss_feed</span>
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 md:flex md:gap-20">
                            <div className="flex flex-col gap-3">
                                <h4 className="text-sm font-bold text-[color:var(--text-main-theme)]">
                                    {dictionary.footer.content}
                                </h4>
                                {settings.content.footerContentLinks.map((item) => (
                                    <Link
                                        key={`${item.href}-${item.label}`}
                                        href={withLocale(item.href, locale)}
                                        className="theme-muted text-sm transition-colors hover:text-primary"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                            <div className="flex flex-col gap-3">
                                <h4 className="text-sm font-bold text-[color:var(--text-main-theme)]">
                                    {dictionary.footer.company}
                                </h4>
                                {settings.content.footerCompanyLinks.map((item) => (
                                    <Link
                                        key={`${item.href}-${item.label}`}
                                        href={withLocale(item.href, locale)}
                                        className="theme-muted text-sm transition-colors hover:text-primary"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="theme-border my-8 h-px w-full bg-transparent" />

                    <div className="theme-muted flex flex-col items-center justify-between gap-4 text-sm sm:flex-row">
                        <p>© 2024 DevOps Daily. {dictionary.footer.allRightsReserved}</p>
                        <p className="flex items-center gap-1">
                            {dictionary.footer.madeForCommunity}
                            <span className="material-symbols-outlined !text-[16px] text-red-500">favorite</span>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
