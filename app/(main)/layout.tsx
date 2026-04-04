import { AuthBootstrap } from '@/components/auth/auth-bootstrap';
import { BlogFooter } from '@/components/layout/blog-footer';
import { BlogHeader } from '@/components/layout/blog-header';
import { CookieConsentBanner } from '@/components/layout/cookie-consent-banner';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-text-main dark:text-white transition-colors duration-200">
            <AuthBootstrap />
            <BlogHeader />
            <main className="flex flex-1 flex-col items-center w-full px-4 md:px-10 py-6 md:py-10">
                {children}
            </main>
            <CookieConsentBanner />
            <BlogFooter />
        </div>
    );
}
