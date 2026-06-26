import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n/server";
import { PrivacyPolicyPageContent } from "./privacy-policy-page-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read how DevOps Daily handles account data, newsletter subscriptions, comments, support requests, and privacy controls for registered users and readers.",
  alternates: {
    canonical: "/privacy-policy",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default async function PrivacyPolicyPage() {
  const locale = await getRequestLocale();
  return <PrivacyPolicyPageContent locale={locale} />;
}
