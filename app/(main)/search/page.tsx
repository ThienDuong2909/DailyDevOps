import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n/server";
import { resolveSearchRedirect } from "./search-redirect";

export const metadata: Metadata = {
  title: "Search Articles",
  description:
    "Search DevOps Daily articles by Kubernetes, CI/CD, monitoring, platform engineering, and production infrastructure topics.",
  alternates: {
    canonical: "/search",
  },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  const locale = await getRequestLocale();
  await resolveSearchRedirect(searchParams, locale);
}
