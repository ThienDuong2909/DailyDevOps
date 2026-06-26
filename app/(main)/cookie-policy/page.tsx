import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n/server";
import { CookiePolicyPageContent } from "./cookie-policy-page-content";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Understand how DevOps Daily uses essential cookies, local storage, and consent preferences across the public site experience.",
  alternates: {
    canonical: "/cookie-policy",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default async function CookiePolicyPage() {
  const locale = await getRequestLocale();
  return <CookiePolicyPageContent locale={locale} />;
}
