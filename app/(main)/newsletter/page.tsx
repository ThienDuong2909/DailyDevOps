import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n/server";
import { NewsletterPageContent } from "./newsletter-page-content";

export const metadata: Metadata = {
  title: "DevOps Daily Newsletter",
  description:
    "Subscribe to the DevOps Daily newsletter for weekly notes on Kubernetes, CI/CD, observability, reliability, and real-world infrastructure workflows.",
  alternates: {
    canonical: "/newsletter",
  },
};

export default async function NewsletterPage() {
  const locale = await getRequestLocale();
  return <NewsletterPageContent locale={locale} />;
}
