import type { Metadata } from "next";
import { Suspense } from "react";
import { permanentRedirect } from "next/navigation";
import { BlogListingContent } from "@/components/blog/blog-listing-content";
import { BlogListingFallback } from "@/components/blog/blog-listing-fallback";
import { fetchCategoryListingData } from "@/lib/api/server";
import {
  buildBlogRedirectTarget,
  buildCategoryIndexMetadata,
  normalizeListingSearchParams,
  type ListingSearchParams,
} from "@/lib/blog-listing";
import { normalizeLocale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";

export async function generateMetadata({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const resolved = params ? await params : undefined;
  const resolvedLocale = resolved?.locale
    ? normalizeLocale(resolved.locale)
    : await getRequestLocale();

  return buildCategoryIndexMetadata(resolvedLocale);
}

export default async function CategoryIndexPage({
  params,
  searchParams,
}: {
  params?: Promise<{ locale?: string }>;
  searchParams?: Promise<ListingSearchParams>;
}) {
  const [resolvedParams, resolvedSearch] = await Promise.all([
    params ? params : Promise.resolve(undefined),
    searchParams ? searchParams : Promise.resolve(undefined),
  ]);

  if (resolvedSearch?.category && resolvedSearch.category !== "all") {
    permanentRedirect(buildBlogRedirectTarget(resolvedSearch));
  }

  const resolvedLocale = resolvedParams?.locale
    ? normalizeLocale(resolvedParams.locale)
    : await getRequestLocale();
  const { page, sort, hasSearch } =
    normalizeListingSearchParams(resolvedSearch);
  const ssrData = await fetchCategoryListingData({
    locale: resolvedLocale,
    page,
    sort,
    skipPosts: hasSearch,
  });

  return (
    <Suspense fallback={<BlogListingFallback />}>
      <BlogListingContent
        key={`${resolvedLocale}:all`}
        initialLocale={resolvedLocale}
        initialPage={hasSearch ? 1 : page}
        initialSort={hasSearch ? "latest" : sort}
        {...ssrData}
      />
    </Suspense>
  );
}
