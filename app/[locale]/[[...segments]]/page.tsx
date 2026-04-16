import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MainHomePage from '@/app/(main)/page';
import BlogPage from '@/app/(main)/blog/page';
import BlogDetailClient from '@/app/(main)/blog/[slug]/blog-detail-client';
import CategoryPage from '@/app/(main)/category/[slug]/page';
import TagPage from '@/app/(main)/tag/[slug]/page';
import AuthorPage from '@/app/(main)/author/[username]/page';
import ContactPage from '@/app/(main)/contact/page';
import { resolveSearchRedirect } from '@/app/(main)/search/search-redirect';
import NewsletterConfirmPage from '@/app/(main)/newsletter/confirm/page';
import { AboutPageContent } from '@/app/(main)/about/about-page-content';
import { NewsletterPageContent } from '@/app/(main)/newsletter/newsletter-page-content';
import { PrivacyPolicyPageContent } from '@/app/(main)/privacy-policy/privacy-policy-page-content';
import { TermsOfServicePageContent } from '@/app/(main)/terms-of-service/terms-of-service-page-content';
import { CookiePolicyPageContent } from '@/app/(main)/cookie-policy/cookie-policy-page-content';
import { DmcaPolicyPageContent } from '@/app/(main)/dmca-policy/dmca-policy-page-content';
import { LocaleRouteSync } from '@/components/i18n/locale-route-sync';
import { DEFAULT_LOCALE, isSupportedLocale } from '@/lib/i18n/config';

const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://dailydevops.blog';

const apiBaseUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001';

interface RouteParams {
    locale: string;
    segments?: string[];
}

interface PostSeoData {
    title: string;
    slug: string;
    locale?: string;
    localeAlternates?: Partial<Record<'vi' | 'en', string>>;
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

function toAbsoluteUrl(value?: string | null) {
    if (!value) {
        return undefined;
    }

    if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
    }

    return `${siteUrl}${value.startsWith('/') ? '' : '/'}${value}`;
}

async function getPostSeo(slug: string, locale: string): Promise<PostSeoData | null> {
    try {
        const res = await fetch(`${apiBaseUrl}/api/v1/seo/post-meta/${slug}?locale=${locale}`, {
            next: { revalidate: 300 },
        });

        if (!res.ok) {
            return null;
        }

        const json = await res.json();
        return json.data || null;
    } catch {
        return null;
    }
}

function buildLocalizedPath(locale: string, path = '/') {
    if (path === '/') {
        return `/${locale}`;
    }

    return `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
}

function buildQueryString(searchParams?: Record<string, string | undefined>) {
    const params = new URLSearchParams();

    Object.entries(searchParams || {}).forEach(([key, value]) => {
        if (value) {
            params.set(key, value);
        }
    });

    const serialized = params.toString();
    return serialized ? `?${serialized}` : '';
}

function getStaticPageMetadata(locale: string, slug: string): Metadata | null {
    const pageCopy = {
        vi: {
            about: {
                title: 'Giới thiệu Daily DevOps',
                description:
                    'Tìm hiểu Daily DevOps đang tập trung vào chủ đề gì, đội ngũ biên tập tiếp cận nội dung hạ tầng thực chiến ra sao và các mảng DevOps, platform engineering mà website theo đuổi.',
            },
            contact: {
                title: 'Liên hệ Daily DevOps',
                description:
                    'Liên hệ Daily DevOps để trao đổi ý tưởng bài viết, nhu cầu hợp tác, hỗ trợ newsletter và các cuộc trao đổi kỹ thuật liên quan.',
            },
            search: {
                title: 'Tìm kiếm bài viết',
                description:
                    'Tìm kiếm bài viết Daily DevOps theo Kubernetes, CI/CD, monitoring, platform engineering và các chủ đề hạ tầng production.',
            },
            newsletter: {
                title: 'Bản tin Daily DevOps',
                description:
                    'Đăng ký bản tin Daily DevOps để nhận ghi chú hàng tuần về Kubernetes, CI/CD, observability, reliability và các workflow hạ tầng thực tế.',
            },
            'privacy-policy': {
                title: 'Chính sách quyền riêng tư',
                description:
                    'Tìm hiểu Daily DevOps xử lý dữ liệu tài khoản, đăng ký bản tin, bình luận, yêu cầu hỗ trợ và các quyền kiểm soát quyền riêng tư như thế nào.',
            },
            'terms-of-service': {
                title: 'Điều khoản sử dụng',
                description:
                    'Xem lại các điều khoản áp dụng cho tài khoản độc giả, nội dung biên tập, phạm vi sử dụng hợp lệ và các giới hạn dịch vụ trên Daily DevOps.',
            },
            'cookie-policy': {
                title: 'Chính sách cookie',
                description:
                    'Hiểu cách Daily DevOps sử dụng cookie thiết yếu, local storage và các tùy chọn consent trong trải nghiệm công khai của website.',
            },
            'dmca-policy': {
                title: 'Chính sách DMCA',
                description:
                    'Xem quy trình tiếp nhận khiếu nại bản quyền, gỡ nội dung, phản hồi phản đối và xử lý tái phạm của Daily DevOps đối với nội dung biên tập và cộng đồng.',
            },
        },
        en: {
            about: {
                title: 'About DevOps Daily',
                description:
                    'Learn what DevOps Daily covers, how the editorial team approaches practical infrastructure content, and where the publication focuses across DevOps and platform engineering.',
            },
            contact: {
                title: 'Contact DevOps Daily',
                description:
                    'Reach DevOps Daily for editorial ideas, partnership requests, newsletter support, and technical collaboration conversations.',
            },
            search: {
                title: 'Search Articles',
                description:
                    'Search DevOps Daily articles by Kubernetes, CI/CD, monitoring, platform engineering, and production infrastructure topics.',
            },
            newsletter: {
                title: 'DevOps Daily Newsletter',
                description:
                    'Subscribe to the DevOps Daily newsletter for weekly notes on Kubernetes, CI/CD, observability, reliability, and real-world infrastructure workflows.',
            },
            'privacy-policy': {
                title: 'Privacy Policy',
                description:
                    'Read how DevOps Daily handles account data, newsletter subscriptions, comments, support requests, and privacy controls for registered users and readers.',
            },
            'terms-of-service': {
                title: 'Terms of Service',
                description:
                    'Review the terms that govern reader accounts, editorial content, acceptable use, and service limitations across DevOps Daily.',
            },
            'cookie-policy': {
                title: 'Cookie Policy',
                description:
                    'Understand how DevOps Daily uses essential cookies, local storage, and consent preferences across the public site experience.',
            },
            'dmca-policy': {
                title: 'DMCA Policy',
                description:
                    'Review the DevOps Daily copyright complaint, takedown, counter notice, and repeat infringement process for editorial and community content.',
            },
        },
    } as const;

    const localeKey = locale === 'en' ? 'en' : 'vi';
    const page = pageCopy[localeKey][slug as keyof (typeof pageCopy)[typeof localeKey]];

    if (!page) {
        return null;
    }

    return {
        title: page.title,
        description: page.description,
        alternates: {
            canonical: buildLocalizedPath(locale, `/${slug}`),
        },
        robots:
            slug === 'privacy-policy' || slug === 'terms-of-service' || slug === 'cookie-policy' || slug === 'dmca-policy'
                ? {
                      index: false,
                      follow: true,
                  }
                : undefined,
    };
}

async function buildArticleMetadata(slug: string, locale: string): Promise<Metadata> {
    const post = await getPostSeo(slug, locale);

    if (!post) {
        return {
            title: locale === 'en' ? 'Post Not Found' : 'Không tìm thấy bài viết',
            description:
                locale === 'en'
                    ? 'The requested blog post could not be found.'
                    : 'Không tìm thấy bài viết bạn yêu cầu.',
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
        (locale === 'en'
            ? `Read "${post.title}" on DevOps Blog`
            : `Đọc "${post.title}" trên DailyDevOps.blog`);
    const ogImage = toAbsoluteUrl(post.seoSetting?.ogImage || post.featuredImage);
    const canonicalUrl = post.seoSetting?.canonicalUrl || `${siteUrl}${buildLocalizedPath(locale, `/${post.slug}`)}`;
    const authorName = `${post.author.firstName} ${post.author.lastName}`;
    const languageAlternates = Object.entries(post.localeAlternates || {}).reduce<Record<string, string>>(
        (acc, [alternateLocale, alternateSlug]) => {
            if (alternateSlug) {
                acc[alternateLocale] = `${siteUrl}${buildLocalizedPath(alternateLocale, `/${alternateSlug}`)}`;
            }

            return acc;
        },
        {}
    );
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
            type: 'article',
            locale: locale === 'vi' ? 'vi_VN' : 'en_US',
            title,
            description,
            url: `${siteUrl}${buildLocalizedPath(locale, `/${post.slug}`)}`,
            siteName: 'DevOps Blog',
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
            card: 'summary_large_image',
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

export async function generateMetadata({
    params,
}: {
    params: Promise<RouteParams>;
}): Promise<Metadata> {
    const { locale, segments = [] } = await params;

    if (!isSupportedLocale(locale)) {
        return {};
    }

    if (segments.length === 0) {
        return {
            title: locale === 'en' ? 'DevOps Blog' : 'Daily DevOps',
            alternates: {
                canonical: buildLocalizedPath(locale),
            },
        };
    }

    if ((segments.length === 1 && !segments[0].includes('.')) || (segments.length === 2 && segments[0] === 'blog')) {
        const slug = segments.length === 2 ? segments[1] : segments[0];
        const knownStaticPages = new Set([
            'about',
            'contact',
            'search',
            'newsletter',
            'privacy-policy',
            'terms-of-service',
            'cookie-policy',
            'dmca-policy',
        ]);

        if (!knownStaticPages.has(slug) && segments[0] !== 'blog') {
            return buildArticleMetadata(slug, locale);
        }

        if (segments[0] === 'blog' && segments[1]) {
            return buildArticleMetadata(segments[1], locale);
        }

        const staticMetadata = getStaticPageMetadata(locale, slug);

        if (staticMetadata) {
            return staticMetadata;
        }
    }

    if (segments[0] === 'blog' && segments.length === 1) {
        return {
            title: locale === 'en' ? 'Articles' : 'Bài viết',
            description:
                locale === 'en'
                    ? 'Browse the latest DevOps Daily articles.'
                    : 'Khám phá những bài viết mới nhất về DevOps, cloud và automation.',
            alternates: {
                canonical: buildLocalizedPath(locale, '/blog'),
            },
        };
    }

    return {
        alternates: {
            canonical: buildLocalizedPath(locale, `/${segments.join('/')}`),
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

    if (!isSupportedLocale(locale)) {
        notFound();
    }

    const currentPath = segments.length === 0 ? '/' : `/${segments.join('/')}`;
    const querySuffix = buildQueryString(resolvedSearchParams);
    const alternates = {
        vi: `${buildLocalizedPath('vi', currentPath)}${querySuffix}`,
        en: `${buildLocalizedPath('en', currentPath)}${querySuffix}`,
    };

    if (segments.length === 0) {
        return (
            <>
                <LocaleRouteSync alternates={alternates} />
                <MainHomePage />
            </>
        );
    }

    if (segments.length === 1) {
        switch (segments[0]) {
            case 'about':
                return (
                    <>
                        <LocaleRouteSync alternates={alternates} />
                        <AboutPageContent locale={locale} />
                    </>
                );
            case 'contact':
                return (
                    <>
                        <LocaleRouteSync alternates={alternates} />
                        <ContactPage />
                    </>
                );
            case 'search': {
                await resolveSearchRedirect(searchParams, locale);
                return null;
            }
            case 'newsletter':
                return (
                    <>
                        <LocaleRouteSync alternates={alternates} />
                        <NewsletterPageContent locale={locale} />
                    </>
                );
            case 'privacy-policy':
                return (
                    <>
                        <LocaleRouteSync alternates={alternates} />
                        <PrivacyPolicyPageContent locale={locale} />
                    </>
                );
            case 'terms-of-service':
                return (
                    <>
                        <LocaleRouteSync alternates={alternates} />
                        <TermsOfServicePageContent locale={locale} />
                    </>
                );
            case 'cookie-policy':
                return (
                    <>
                        <LocaleRouteSync alternates={alternates} />
                        <CookiePolicyPageContent locale={locale} />
                    </>
                );
            case 'dmca-policy':
                return (
                    <>
                        <LocaleRouteSync alternates={alternates} />
                        <DmcaPolicyPageContent locale={locale} />
                    </>
                );
            case 'blog':
                return (
                    <>
                        <LocaleRouteSync alternates={alternates} />
                        <BlogPage />
                    </>
                );
            default:
                return (
                    <>
                        <LocaleRouteSync alternates={alternates} />
                        <BlogDetailClient slugOverride={segments[0]} />
                    </>
                );
        }
    }

    if (segments.length === 2) {
        if (segments[0] === 'blog') {
            return (
                <>
                    <LocaleRouteSync alternates={alternates} />
                    <BlogDetailClient slugOverride={segments[1]} />
                </>
            );
        }

        if (segments[0] === 'category') {
            return (
                <>
                    <LocaleRouteSync alternates={alternates} />
                    {await CategoryPage({ params: Promise.resolve({ slug: segments[1], locale }) })}
                </>
            );
        }

        if (segments[0] === 'tag') {
            return (
                <>
                    <LocaleRouteSync alternates={alternates} />
                    {await TagPage({ params: Promise.resolve({ slug: segments[1], locale }) })}
                </>
            );
        }

        if (segments[0] === 'author') {
            return (
                <>
                    <LocaleRouteSync alternates={alternates} />
                    {await AuthorPage({ params: Promise.resolve({ username: segments[1], locale }) })}
                </>
            );
        }

        if (segments[0] === 'newsletter' && segments[1] === 'confirm') {
            return (
                <>
                    <LocaleRouteSync alternates={alternates} />
                    <NewsletterConfirmPage />
                </>
            );
        }
    }

    notFound();
}
