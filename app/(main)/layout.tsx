import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { BlogFooter } from "@/components/layout/blog-footer";
import { BlogHeader } from "@/components/layout/blog-header";
import { CookieConsentBanner } from "@/components/layout/cookie-consent-banner";
import { getRequestLocale } from "@/lib/i18n/server";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <LocaleProvider locale={locale}>
      <div className="site-ambient-shell relative flex min-h-screen w-full flex-col bg-background-light text-text-main transition-colors duration-200 dark:bg-background-dark dark:text-white">
        <div className="site-ambient-background" aria-hidden="true">
          <span className="site-liquid-blob site-liquid-blob-one" />
          <span className="site-liquid-blob site-liquid-blob-two" />
          <span className="site-liquid-blob site-liquid-blob-three" />
          <span className="site-liquid-blob site-liquid-blob-four" />
        </div>
        <AuthBootstrap />
        <BlogHeader />
        <main className="relative z-10 flex flex-1 flex-col items-center w-full px-4 md:px-10 py-6">
          {children}
        </main>
        <CookieConsentBanner />
        <div className="relative z-10">
          <BlogFooter />
        </div>
      </div>
    </LocaleProvider>
  );
}
