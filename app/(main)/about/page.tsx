import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n/server";
import { AboutPageContent } from "./about-page-content";

export const metadata: Metadata = {
  title: "About DevOps Daily",
  description:
    "Learn what DevOps Daily covers, how the editorial team approaches practical infrastructure content, and where the publication focuses across DevOps and platform engineering.",
  alternates: {
    canonical: "/about",
  },
};

export default async function AboutPage() {
  const locale = await getRequestLocale();
  return <AboutPageContent locale={locale} />;
}
