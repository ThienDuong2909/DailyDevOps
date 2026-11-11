import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BlogListingContent } from "@/components/blog/blog-listing-content";
import { BlogListingFallback } from "@/components/blog/blog-listing-fallback";
import {
  fetchCategoryBySlug,
  fetchCategoryListingData,
} from "@/lib/api/server";
import {
  buildCategoryDetailMetadata,
  normalizeListingSearchParams,
  type ListingSearchParams,
} from "@/lib/blog-listing";
import { normalizeLocale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale?: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const resolvedLocale = locale
    ? normalizeLocale(locale)
    : await getRequestLocale();
  const category = await fetchCategoryBySlug(slug);

  return buildCategoryDetailMetadata({
    category,
    locale: resolvedLocale,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale?: string }>;
  searchParams?: Promise<ListingSearchParams>;
}) {
  const [{ slug, locale }, resolvedSearch] = await Promise.all([
    params,
    searchParams ? searchParams : Promise.resolve(undefined),
  ]);
  const resolvedLocale = locale
    ? normalizeLocale(locale)
    : await getRequestLocale();
  const category = await fetchCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const { page, sort, hasSearch } =
    normalizeListingSearchParams(resolvedSearch);
  const ssrData = await fetchCategoryListingData({
    locale: resolvedLocale,
    categorySlug: category.slug,
    page,
    sort,
    skipPosts: hasSearch,
  });

  return (
    <Suspense fallback={<BlogListingFallback />}>
      <BlogListingContent
        key={`${resolvedLocale}:${category.slug}`}
        initialCategorySlug={category.slug}
        initialLocale={resolvedLocale}
        initialPage={hasSearch ? 1 : page}
        initialSort={hasSearch ? "latest" : sort}
        {...ssrData}
      />
    </Suspense>
  );
}
