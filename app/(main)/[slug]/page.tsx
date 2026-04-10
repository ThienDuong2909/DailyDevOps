import type { Metadata } from 'next';
import BlogDetailClient from '../blog/[slug]/blog-detail-client';

const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://blog.thienduong.info';

const apiBaseUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001';

function toAbsoluteUrl(value?: string | null) {
    if (!value) {
        return undefined;
    }

    if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
    }

    return `${siteUrl}${value.startsWith('/') ? '' : '/'}${value}`;
}

interface PostSeoData {
    title: string;
    slug: string;
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

async function getPostSeo(slug: string): Promise<PostSeoData | null> {
    try {
        const res = await fetch(`${apiBaseUrl}/api/v1/seo/post-meta/${slug}`, {
            next: { revalidate: 300 },
        });

        if (!res.ok) return null;

        const json = await res.json();
        return json.data || null;
    } catch {
        return null;
    }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostSeo(slug);

    if (!post) {
        return {
            title: 'Post Not Found',
            description: 'The requested blog post could not be found.',
        };
    }

    const title = post.seoSetting?.metaTitle || post.title;
    const description =
        post.seoSetting?.metaDescription ||
        post.excerpt ||
        `Read "${post.title}" on DevOps Blog`;
    const ogImage = toAbsoluteUrl(post.seoSetting?.ogImage || post.featuredImage);
    const canonicalUrl =
        post.seoSetting?.canonicalUrl || `${siteUrl}/${post.slug}`;
    const authorName = `${post.author.firstName} ${post.author.lastName}`;
    const keywords = post.seoSetting?.focusKeywords?.length
        ? post.seoSetting.focusKeywords
        : post.tags.map((t) => t.name);

    return {
        title,
        description,
        keywords,
        authors: [{ name: authorName }],
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            type: 'article',
            title,
            description,
            url: `${siteUrl}/${post.slug}`,
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
            tags: post.tags.map((t) => t.name),
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
        other: {
            'article:published_time': post.publishedAt || '',
            'article:modified_time': post.updatedAt || '',
            'article:author': authorName,
            ...(post.readingTime && {
                'twitter:label1': 'Reading time',
                'twitter:data1': `${post.readingTime} min read`,
            }),
        },
    };
}

export default function PostDetailPage() {
    return <BlogDetailClient />;
}
