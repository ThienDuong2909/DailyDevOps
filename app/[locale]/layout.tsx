import { notFound } from "next/navigation";
import MainLayout from "@/app/(main)/layout";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { isSupportedLocale } from "@/lib/i18n/config";

export default async function LocalizedLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return (
    <LocaleProvider locale={locale}>
      <MainLayout>{children}</MainLayout>
    </LocaleProvider>
  );
}
