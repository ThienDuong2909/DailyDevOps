import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: {
        default: 'DevOps Blog - Automate Everything, Deploy Anywhere',
        template: '%s | DevOps Blog',
    },
    description: 'The leading platform for DevOps insights, cloud-native technologies, and automation best practices.',
    keywords: ['DevOps', 'Kubernetes', 'Docker', 'CI/CD', 'Cloud', 'Automation'],
    authors: [{ name: 'DevOps Team' }],
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://devopsblog.com',
        siteName: 'DevOps Blog',
        title: 'DevOps Blog',
        description: 'Automate Everything, Deploy Anywhere',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'DevOps Blog',
        description: 'The leading platform for DevOps insights',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <head>
                {/* Google Fonts - Inter */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
                {/* Material Symbols Outlined */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
                    rel="stylesheet"
                />
            </head>
            <body className={`${inter.variable} font-display bg-background-light dark:bg-background-dark text-gray-900 dark:text-white antialiased`}>
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
