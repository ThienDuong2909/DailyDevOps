import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter, Manrope } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AnalyticsProvider } from '@/components/analytics/analytics-provider';
import { SentryProvider } from '@/components/observability/sentry-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });
const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://dailydevops.blog';

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: 'DevOps Blog - Automate Everything, Deploy Anywhere',
        template: '%s | DevOps Blog',
    },
    description:
        'The leading platform for DevOps insights, cloud-native technologies, and automation best practices. Expert articles on Kubernetes, CI/CD, Docker, and Cloud Architecture.',
    keywords: [
        'DevOps',
        'Kubernetes',
        'Docker',
        'CI/CD',
        'Cloud',
        'Automation',
        'Infrastructure as Code',
        'Monitoring',
        'Container Orchestration',
    ],
    authors: [{ name: 'DevOps Team' }],
    creator: 'DevOps Blog Team',
    publisher: 'DevOps Blog',
    alternates: {
        canonical: siteUrl,
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: siteUrl,
        siteName: 'DevOps Blog',
        title: 'DevOps Blog - Automate Everything, Deploy Anywhere',
        description:
            'Expert articles on Kubernetes, CI/CD, Cloud Architecture and DevOps best practices.',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'DevOps Blog',
        description: 'The leading platform for DevOps insights',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    // Uncomment and fill your verification codes after registering with search engines:
    // verification: {
    //     google: 'YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE',
    //     yandex: 'YOUR_YANDEX_VERIFICATION_CODE',
    // },
};

/**
 * JSON-LD: WebSite schema — enables Google sitelinks searchbox
 */
const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DevOps Blog',
    url: siteUrl,
    description:
        'Expert articles on Kubernetes, CI/CD, Cloud Architecture and DevOps best practices.',
    publisher: {
        '@type': 'Organization',
        name: 'DevOps Blog',
        url: siteUrl,
    },
    potentialAction: {
        '@type': 'SearchAction',
        target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* JSON-LD: WebSite structured data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(websiteJsonLd),
                    }}
                />
                {/* Material Symbols Outlined */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
                    rel="stylesheet"
                />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            try {
                                if (localStorage.theme === 'light' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: light)').matches)) {
                                    document.documentElement.classList.remove('dark');
                                } else {
                                    document.documentElement.classList.add('dark');
                                }
                            } catch (_) {}
                        `,
                    }}
                />
            </head>
            <body className={`${inter.variable} ${manrope.variable} font-display bg-background-light dark:bg-background-dark text-gray-900 dark:text-white antialiased`}>
                <SentryProvider />
                <Suspense fallback={null}>
                    <AnalyticsProvider />
                </Suspense>
                {children}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#1e293b',
                            color: '#fff',
                            border: '1px solid #283039',
                        },
                        success: {
                            iconTheme: {
                                primary: '#22c55e',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
            </body>
        </html>
    );
}
