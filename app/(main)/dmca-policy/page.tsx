import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n/server";
import { DmcaPolicyPageContent } from "./dmca-policy-page-content";

export const metadata: Metadata = {
  title: "DMCA Policy",
  description:
    "Review the DevOps Daily copyright complaint, takedown, counter notice, and repeat infringement process for editorial and community content.",
  alternates: {
    canonical: "/dmca-policy",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default async function DmcaPolicyPage() {
  const locale = await getRequestLocale();
  return <DmcaPolicyPageContent locale={locale} />;
}
