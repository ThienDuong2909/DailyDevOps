import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MainHomePage from "@/app/(main)/page";
import BlogPage from "@/app/(main)/blog/page";
import BlogDetailClient from "@/app/(main)/blog/[slug]/blog-detail-client";
import CategoryPage from "@/app/(main)/category/[slug]/page";
import TagPage from "@/app/(main)/tag/[slug]/page";
import AuthorPage from "@/app/(main)/author/[username]/page";
import ContactPage from "@/app/(main)/contact/page";
import { resolveSearchRedirect } from "@/app/(main)/search/search-redirect";
import NewsletterConfirmPage from "@/app/(main)/newsletter/confirm/page";
import { AboutPageContent } from "@/app/(main)/about/about-page-content";
import { NewsletterPageContent } from "@/app/(main)/newsletter/newsletter-page-content";
import { PrivacyPolicyPageContent } from "@/app/(main)/privacy-policy/privacy-policy-page-content";
import { TermsOfServicePageContent } from "@/app/(main)/terms-of-service/terms-of-service-page-content";
import { CookiePolicyPageContent } from "@/app/(main)/cookie-policy/cookie-policy-page-content";
import { DmcaPolicyPageContent } from "@/app/(main)/dmca-policy/dmca-policy-page-content";
import { isSupportedLocale } from "@/lib/i18n/config";
import type { SiteLocale } from "@/lib/i18n/config";
import { SITE_URL, API_BASE_URL } from "@/lib/constants/site";
import {
  fetchPostBySlug,
  fetchRelatedPosts,
  fetchPopularPosts,
} from "@/lib/api/server";

// C1: ISR — regenerate pages every hour
export const revalidate = 3600;

const siteUrl = SITE_URL;

const apiBaseUrl = API_BASE_URL;

interface RouteParams {
  locale: string;
  segments?: string[];
}

interface PostSeoData {
  title: string;
  slug: string;
  locale?: string;
  localeAlternates?: Partial<Record<"vi" | "en", string>>;
  excerpt?: string;
  featuredImage?: string;
  publishedAt?: string;
  updatedAt?: string;
  readingTime?: number;
  author: {
    firstName: string;
    lastName: string;
  };
  category?: {
    name: string;
    slug: string;
  };
  tags: { name: string }[];
  seoSetting?: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogImage?: string;
    noIndex?: boolean;
    noFollow?: boolean;
    focusKeywords?: string[];
  };
}

const KNOWN_STATIC_PAGES = new Set([
  "about",
  "contact",
  "search",
  "newsletter",
  "privacy-policy",
  "terms-of-service",
  "cookie-policy",
  "dmca-policy",
]);

function toAbsoluteUrl(value?: string | null) {
  if (!value) {
    return undefined;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${siteUrl}${value.startsWith("/") ? "" : "/"}${value}`;
}

async function getPostSeo(
  slug: string,
  locale: string,
): Promise<PostSeoData | null> {
  try {
    const res = await fetch(
      `${apiBaseUrl}/api/v1/seo/post-meta/${slug}?locale=${locale}`,
      {
        next: { revalidate: 300 },
      },
    );

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

/**
 * Build a clean canonical path without locale prefix.
 * Phase 2: URLs are locale-agnostic — locale is stored in a cookie,
 * not encoded in the path. hreflang alternates use absolute URLs.
 */
function buildCleanPath(path = "/") {
  if (path === "/") {
    return "/";
  }
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * @deprecated Keep for internal use in metadata only — generates absolute
 * locale-prefixed alternate URLs for hreflang <link rel="alternate"> tags.
 * These are absolute so Google can distinguish language variants even
 * without locale in the visible URL.
 */
function buildLocalizedPath(locale: string, path = "/") {
  if (path === "/") {
    return `/${locale}`;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalizedPath}`;
}

function buildQueryString(searchParams?: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

function toSiteLocale(locale: string): SiteLocale | null {
  return isSupportedLocale(locale) ? locale : null;
}

/**
 * Generate hreflang alternate URLs (absolute, locale-prefixed).
 * These are used in <head> metadata only — not visible in browser URL bar.
 * Google uses these to serve the correct language version to each region.
 */
function getLocaleAlternates(
  currentPath: string,
  querySuffix: string,
): Record<"vi" | "en", string> {
  // Phase 2: Both locales share the same clean URL, so emitting hreflang
  // alternates that point to the same URL sends confusing signals to Google.
  // Return an empty record — hreflang will only be set on article pages
  // where localeAlternates from the API provide genuinely different slugs.
  return {} as Record<"vi" | "en", string>;
}

/**
 * Wraps page content. LocaleRouteSync is no longer needed because
 * switchLocale uses router.refresh() instead of router.push(), so
 * the header does not need to know alternate paths for navigation.
 */
function wrapWithLocaleSync(
  _alternates: Record<"vi" | "en", string>,
  content: React.ReactNode,
) {
  return content;
}

function getStaticPageMetadata(locale: string, slug: string): Metadata | null {
  const pageCopy = {
    vi: {
      about: {
        title: "Giới thiệu Daily DevOps",
        description:
          "Tìm hiểu Daily DevOps đang tập trung vào chủ đề gì, đội ngũ biên tập tiếp cận nội dung hạ tầng thực chiến ra sao và các mảng DevOps, platform engineering mà website theo đuổi.",
      },
      contact: {
        title: "Liên hệ Daily DevOps",
        description:
          "Liên hệ Daily DevOps để trao đổi ý tưởng bài viết, nhu cầu hợp tác, hỗ trợ newsletter và các cuộc trao đổi kỹ thuật liên quan.",
      },
      search: {
        title: "Tìm kiếm bài viết",
        description:
          "Tìm kiếm bài viết Daily DevOps theo Kubernetes, CI/CD, monitoring, platform engineering và các chủ đề hạ tầng production.",
      },
      newsletter: {
        title: "Bản tin Daily DevOps",
        description:
          "Đăng ký bản tin Daily DevOps để nhận ghi chú hàng tuần về Kubernetes, CI/CD, observability, reliability và các workflow hạ tầng thực tế.",
      },
      "privacy-policy": {
        title: "Chính sách quyền riêng tư",
        description:
          "Tìm hiểu Daily DevOps xử lý dữ liệu tài khoản, đăng ký bản tin, bình luận, yêu cầu hỗ trợ và các quyền kiểm soát quyền riêng tư như thế nào.",
      },
      "terms-of-service": {
        title: "Điều khoản sử dụng",
        description:
          "Xem lại các điều khoản áp dụng cho tài khoản độc giả, nội dung biên tập, phạm vi sử dụng hợp lệ và các giới hạn dịch vụ trên Daily DevOps.",
      },
      "cookie-policy": {
        title: "Chính sách cookie",
        description:
          "Hiểu cách Daily DevOps sử dụng cookie thiết yếu, local storage và các tùy chọn consent trong trải nghiệm công khai của website.",
      },
      "dmca-policy": {
        title: "Chính sách DMCA",
        description:
          "Xem quy trình tiếp nhận khiếu nại bản quyền, gỡ nội dung, phản hồi phản đối và xử lý tái phạm của Daily DevOps đối với nội dung biên tập và cộng đồng.",
      },
    },
    en: {
      about: {
        title: "About DevOps Daily",
        description:
          "Learn what DevOps Daily covers, how the editorial team approaches practical infrastructure content, and where the publication focuses across DevOps and platform engineering.",
      },
      contact: {
        title: "Contact DevOps Daily",
        description:
          "Reach DevOps Daily for editorial ideas, partnership requests, newsletter support, and technical collaboration conversations.",
      },
      search: {
        title: "Search Articles",
        description:
          "Search DevOps Daily articles by Kubernetes, CI/CD, monitoring, platform engineering, and production infrastructure topics.",
      },
      newsletter: {
        title: "DevOps Daily Newsletter",
        description:
          "Subscribe to the DevOps Daily newsletter for weekly notes on Kubernetes, CI/CD, observability, reliability, and real-world infrastructure workflows.",
      },
      "privacy-policy": {
        title: "Privacy Policy",
        description:
          "Read how DevOps Daily handles account data, newsletter subscriptions, comments, support requests, and privacy controls for registered users and readers.",
      },
      "terms-of-service": {
        title: "Terms of Service",
        description:
          "Review the terms that govern reader accounts, editorial content, acceptable use, and service limitations across DevOps Daily.",
      },
      "cookie-policy": {
        title: "Cookie Policy",
        description:
          "Understand how DevOps Daily uses essential cookies, local storage, and consent preferences across the public site experience.",
      },
      "dmca-policy": {
        title: "DMCA Policy",
        description:
          "Review the DevOps Daily copyright complaint, takedown, counter notice, and repeat infringement process for editorial and community content.",
      },
    },
  } as const;

  const localeKey = locale === "en" ? "en" : "vi";
  const page =
    pageCopy[localeKey][slug as keyof (typeof pageCopy)[typeof localeKey]];

  if (!page) {
    return null;
  }

  const canonicalPath = buildCleanPath(`/${slug}`);
  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `${siteUrl}${canonicalPath}`,
    },
    robots:
      slug === "privacy-policy" ||
      slug === "terms-of-service" ||
      slug === "cookie-policy" ||
      slug === "dmca-policy" ||
      slug === "search"
        ? {
            index: false,
            follow: true,
          }
        : undefined,
  };
}

async function buildArticleMetadata(
  slug: string,
  locale: string,
): Promise<Metadata> {
  const post = await getPostSeo(slug, locale);

  if (!post) {
    return {
      title: locale === "en" ? "Post Not Found" : "Không tìm thấy bài viết",
      description:
        locale === "en"
          ? "The requested blog post could not be found."
          : "Không tìm thấy bài viết bạn yêu cầu.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = post.seoSetting?.metaTitle || post.title;
  const description =
    post.seoSetting?.metaDescription ||
    post.excerpt ||
    (locale === "en"
      ? `Read "${post.title}" on DevOps Blog`
      : `Đọc "${post.title}" trên DailyDevOps.blog`);
  const ogImage = toAbsoluteUrl(post.seoSetting?.ogImage || post.featuredImage);
  const canonicalUrl =
    post.seoSetting?.canonicalUrl ||
    `${siteUrl}${buildCleanPath("/" + post.slug)}`;
  const authorName = `${post.author.firstName} ${post.author.lastName}`;
  // hreflang alternates: use clean paths (slug may differ per locale)
  const languageAlternates = Object.entries(post.localeAlternates || {}).reduce<
    Record<string, string>
  >((acc, [, alternateSlug]) => {
    if (alternateSlug) {
      // Both locales share the same clean URL — Google determines language
      // via hreflang; slug differences are resolved via cookie-driven rewrite.
      acc["vi"] = `${siteUrl}${buildCleanPath("/" + alternateSlug)}`;
      acc["en"] = `${siteUrl}${buildCleanPath("/" + alternateSlug)}`;
    }

    return acc;
  }, {});
  const keywords = post.seoSetting?.focusKeywords?.length
    ? post.seoSetting.focusKeywords
    : post.tags.map((tag) => tag.name);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: languageAlternates,
    },
    openGraph: {
      type: "article",
      locale: locale === "vi" ? "vi_VN" : "en_US",
      title,
      description,
      url: `${siteUrl}${buildCleanPath("/" + post.slug)}`,
      siteName: "DevOps Blog",
      ...(ogImage && {
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      }),
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt || undefined,
      authors: [authorName],
      ...(post.category && { section: post.category.name }),
      tags: post.tags.map((tag) => tag.name),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
    robots: {
      index: !post.seoSetting?.noIndex,
      follow: !post.seoSetting?.noFollow,
    },
  };
}

function getHomeMetadata(locale: SiteLocale): Metadata {
  return {
    title: locale === "en" ? "DevOps Blog" : "Daily DevOps",
    alternates: {
      canonical: siteUrl,
    },
  };
}

function getBlogIndexMetadata(locale: SiteLocale): Metadata {
  return {
    title: locale === "en" ? "Articles" : "Bài viết",
    description:
      locale === "en"
        ? "Browse the latest DevOps Daily articles on Kubernetes, CI/CD, Docker, monitoring, and cloud infrastructure."
        : "Khám phá những bài viết mới nhất về DevOps, Kubernetes, CI/CD, Docker, monitoring và hạ tầng cloud.",
    alternates: {
      canonical: `${siteUrl}/blog`,
    },
  };
}

async function resolveSegmentMetadata(
  locale: SiteLocale,
  segments: string[],
): Promise<Metadata | null> {
  if (segments.length === 0) {
    return getHomeMetadata(locale);
  }

  if (segments[0] === "blog" && segments.length === 1) {
    return getBlogIndexMetadata(locale);
  }

  const isDirectArticleRoute =
    segments.length === 1 && !segments[0].includes(".");
  const isBlogArticleRoute = segments.length === 2 && segments[0] === "blog";

  if (!isDirectArticleRoute && !isBlogArticleRoute) {
    return null;
  }

  const slug = isBlogArticleRoute ? segments[1] : segments[0];

  if (isBlogArticleRoute && slug) {
    return buildArticleMetadata(slug, locale);
  }

  if (!KNOWN_STATIC_PAGES.has(slug)) {
    return buildArticleMetadata(slug, locale);
  }

  return getStaticPageMetadata(locale, slug);
}

async function fetchBlogDetailData(slug: string, locale: SiteLocale) {
  const ssrPost = await fetchPostBySlug(slug, locale);
  const ssrRelated = ssrPost?.id
    ? await fetchRelatedPosts(ssrPost.id, locale)
    : [];
  const ssrPopular = await fetchPopularPosts(locale);

  return {
    ssrPost,
    ssrRelated,
    ssrPopular,
  };
}

async function renderBlogDetailPage(
  slug: string,
  locale: SiteLocale,
  alternates: Record<"vi" | "en", string>,
) {
  const { ssrPost, ssrRelated, ssrPopular } = await fetchBlogDetailData(
    slug,
    locale,
  );

  return wrapWithLocaleSync(
    alternates,
    <BlogDetailClient
      slugOverride={slug}
      initialPost={ssrPost}
      initialRelatedPosts={ssrRelated}
      initialPopularPosts={ssrPopular}
    />,
  );
}

async function renderSingleSegmentPage(
  locale: SiteLocale,
  slug: string,
  alternates: Record<"vi" | "en", string>,
  searchParams?: Promise<{ q?: string; page?: string }>,
) {
  switch (slug) {
    case "about":
      return wrapWithLocaleSync(
        alternates,
        <AboutPageContent locale={locale} />,
      );
    case "contact":
      return wrapWithLocaleSync(alternates, <ContactPage />);
    case "search":
      await resolveSearchRedirect(searchParams, locale);
      return null;
    case "newsletter":
      return wrapWithLocaleSync(
        alternates,
        <NewsletterPageContent locale={locale} />,
      );
    case "privacy-policy":
      return wrapWithLocaleSync(
        alternates,
        <PrivacyPolicyPageContent locale={locale} />,
      );
    case "terms-of-service":
      return wrapWithLocaleSync(
        alternates,
        <TermsOfServicePageContent locale={locale} />,
      );
    case "cookie-policy":
      return wrapWithLocaleSync(
        alternates,
        <CookiePolicyPageContent locale={locale} />,
      );
    case "dmca-policy":
      return wrapWithLocaleSync(
        alternates,
        <DmcaPolicyPageContent locale={locale} />,
      );
    case "blog":
      return wrapWithLocaleSync(alternates, <BlogPage />);
    default:
      return renderBlogDetailPage(slug, locale, alternates);
  }
}

async function renderTwoSegmentPage(
  locale: SiteLocale,
  segments: string[],
  alternates: Record<"vi" | "en", string>,
) {
  const [section, slug] = segments;

  switch (section) {
    case "blog":
      return renderBlogDetailPage(slug, locale, alternates);
    case "category":
      return wrapWithLocaleSync(
        alternates,
        await CategoryPage({ params: Promise.resolve({ slug, locale }) }),
      );
    case "tag":
      return wrapWithLocaleSync(
        alternates,
        await TagPage({ params: Promise.resolve({ slug, locale }) }),
      );
    case "author":
      return wrapWithLocaleSync(
        alternates,
        await AuthorPage({
          params: Promise.resolve({ username: slug, locale }),
        }),
      );
    case "newsletter":
      return slug === "confirm"
        ? wrapWithLocaleSync(alternates, <NewsletterConfirmPage />)
        : null;
    default:
      return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { locale, segments = [] } = await params;

  const activeLocale = toSiteLocale(locale);
  if (!activeLocale) {
    return {};
  }

  const metadata = await resolveSegmentMetadata(activeLocale, segments);
  if (metadata) {
    return metadata;
  }

  const fallbackPath = buildCleanPath(`/${segments.join("/")}`);
  return {
    alternates: {
      canonical: `${siteUrl}${fallbackPath}`,
    },
  };
}

export default async function LocalizedPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  const { locale, segments = [] } = await params;
  const resolvedSearchParams = await searchParams;

  const activeLocale = toSiteLocale(locale);
  if (!activeLocale) {
    notFound();
  }

  const currentPath = segments.length === 0 ? "/" : `/${segments.join("/")}`;
  const querySuffix = buildQueryString(resolvedSearchParams);
  const alternates = getLocaleAlternates(currentPath, querySuffix);

  if (segments.length === 0) {
    return wrapWithLocaleSync(alternates, <MainHomePage />);
  }

  if (segments.length === 1) {
    return renderSingleSegmentPage(
      activeLocale,
      segments[0],
      alternates,
      searchParams,
    );
  }

  if (segments.length === 2) {
    const page = await renderTwoSegmentPage(activeLocale, segments, alternates);
    if (page) {
      return page;
    }
  }

  notFound();
}
