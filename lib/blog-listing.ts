import type { Metadata } from "next";
import type { SiteLocale } from "./i18n/config";
import type { ListingSortOption } from "./api/server";
import { SITE_URL } from "./constants/site";

export interface ListingSearchParams {
  category?: string;
  page?: string;
  q?: string;
  sort?: string;
}

export function buildBlogRedirectTarget(searchParams?: ListingSearchParams) {
  const category = searchParams?.category?.trim();
  const basePath =
    category && category !== "all"
      ? `/category/${encodeURIComponent(category)}`
      : "/category";

  const params = new URLSearchParams();
  if (searchParams?.q) params.set("q", searchParams.q);
  if (searchParams?.sort && searchParams.sort !== "latest") {
    params.set("sort", searchParams.sort);
  }
  if (searchParams?.page && searchParams.page !== "1") {
    params.set("page", searchParams.page);
  }

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function normalizeListingSearchParams(
  searchParams?: ListingSearchParams,
) {
  const rawPage = Number(searchParams?.page || "1");
  const page =
    Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const sort: ListingSortOption =
    searchParams?.sort === "popular" || searchParams?.sort === "oldest"
      ? searchParams.sort
      : "latest";
  const query = searchParams?.q?.trim() || "";

  return {
    page,
    sort,
    query,
    hasSearch: Boolean(query),
  };
}

export function buildCategoryIndexMetadata(
  locale: SiteLocale = "vi",
): Metadata {
  const isEnglish = locale === "en";
  const title = isEnglish
    ? "All DevOps Articles"
    : "Tất cả bài viết DevOps, CI/CD, Kubernetes";
  const socialTitle = `${title} | DevOps Blog`;
  const description = isEnglish
    ? "Browse all practical DevOps, Kubernetes, CI/CD, Docker, and Cloud infrastructure guides on DevOps Daily."
    : "Tổng hợp tất cả các bài viết thực chiến về DevOps, Kubernetes, CI/CD, Docker, Cloud và Monitoring trên Daily DevOps.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/category`,
    },
    openGraph: {
      type: "website",
      locale: isEnglish ? "en_US" : "vi_VN",
      title: socialTitle,
      description,
      url: `${SITE_URL}/category`,
      siteName: "DevOps Blog",
    },
    twitter: {
      card: "summary",
      title: socialTitle,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function buildCategoryDetailMetadata({
  category,
  locale = "vi",
}: {
  category: { name: string; slug: string; description?: string | null } | null;
  locale?: SiteLocale;
}): Metadata {
  const isEnglish = locale === "en";

  if (!category) {
    return {
      title: isEnglish ? "Category Not Found" : "Không tìm thấy chuyên mục",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = isEnglish
    ? `${category.name} Articles`
    : `Chuyên mục ${category.name}`;
  const socialTitle = `${title} | DevOps Blog`;
  const description =
    category.description ||
    (isEnglish
      ? `Explore expert DevOps and platform engineering articles in the ${category.name} category.`
      : `Tổng hợp các bài viết chuyên sâu về ${category.name} trên Daily DevOps: hướng dẫn cài đặt, kiến trúc, best practices và xử lý sự cố.`);

  const canonicalUrl = `${SITE_URL}/category/${category.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      locale: isEnglish ? "en_US" : "vi_VN",
      title: socialTitle,
      description,
      url: canonicalUrl,
      siteName: "DevOps Blog",
    },
    twitter: {
      card: "summary",
      title: socialTitle,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
