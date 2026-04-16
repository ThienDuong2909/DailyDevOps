import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/blog/post-card';
import { normalizeLocale } from '@/lib/i18n/config';
import type { Category, PaginatedResponse, Post } from '@/types';

const apiBaseUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001';

type CategoriesPayload = { data?: Category[] } | Category[];
type PostsPayload = PaginatedResponse<Post> | { data?: PaginatedResponse<Post> | Post[] } | Post[];

function resolveCategories(payload: CategoriesPayload): Category[] {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && typeof payload === 'object' && 'data' in payload) {
        return Array.isArray(payload.data) ? payload.data : [];
    }

    return [];
}

function resolvePosts(payload: PostsPayload): Post[] {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && typeof payload === 'object' && 'data' in payload) {
        const nested = payload.data;

        if (Array.isArray(nested)) {
            return nested;
        }

        if (nested && typeof nested === 'object' && 'data' in nested) {
            return (nested.data as Post[]) || [];
        }
    }

    return (payload as PaginatedResponse<Post>)?.data || [];
}

async function fetchCategories(): Promise<Category[]> {
    try {
        const response = await fetch(`${apiBaseUrl}/api/v1/categories`, {
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            return [];
        }

        const json = await response.json();
        return resolveCategories(json);
    } catch {
        return [];
    }
}

async function fetchPostsByCategory(categoryId: string, locale = 'vi'): Promise<Post[]> {
    try {
        const response = await fetch(
            `${apiBaseUrl}/api/v1/posts/published?categoryId=${encodeURIComponent(categoryId)}&limit=20&sortBy=publishedAt&sortOrder=desc&locale=${locale}`,
            {
                next: { revalidate: 300 },
            }
        );

        if (!response.ok) {
            return [];
        }

        const json = await response.json();
        return resolvePosts(json);
    } catch {
        return [];
    }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string; locale?: string }>;
}): Promise<Metadata> {
    const { slug, locale = 'vi' } = await params;
    const resolvedLocale = normalizeLocale(locale);
    const categories = await fetchCategories();
    const category = categories.find((item) => item.slug === slug);

    if (!category) {
        return {
            title: resolvedLocale === 'en' ? 'Category Not Found' : 'Không tìm thấy chuyên mục',
            robots: {
                index: false,
                follow: false,
            },
        };
    }

    return {
        title: resolvedLocale === 'en' ? `${category.name} Articles` : `Bài viết về ${category.name}`,
        description:
            category.description ||
            (resolvedLocale === 'en'
                ? `Browse published DevOps Daily articles in the ${category.name} category.`
                : `Khám phá các bài viết Daily DevOps thuộc chuyên mục ${category.name}.`),
        alternates: {
            canonical: resolvedLocale === 'vi' ? `/category/${category.slug}` : `/${resolvedLocale}/category/${category.slug}`,
        },
    };
}

export default async function CategoryPage({
    params,
}: {
    params: Promise<{ slug: string; locale?: string }>;
}) {
    const { slug, locale = 'vi' } = await params;
    const resolvedLocale = normalizeLocale(locale);
    const categories = await fetchCategories();
    const category = categories.find((item) => item.slug === slug);

    if (!category) {
        notFound();
    }

    const posts = await fetchPostsByCategory(category.id, resolvedLocale);
    const copy =
        resolvedLocale === 'en'
            ? {
                  label: 'Category',
                  description: category.description || `A curated list of articles in the ${category.name} category.`,
                  count: `${posts.length} articles`,
                  emptyTitle: 'No articles in this category yet',
                  emptyBody: 'When new posts are published in this category, they will appear here.',
              }
            : {
                  label: 'Chuyên mục',
                  description: category.description || `Tổng hợp các bài viết thuộc chủ đề ${category.name}.`,
                  count: `${posts.length} bài viết`,
                  emptyTitle: 'Chưa có bài viết trong chuyên mục này',
                  emptyBody: 'Khi có bài viết mới được publish trong chuyên mục này, chúng sẽ hiển thị tại đây.',
              };

    return (
        <div className="flex w-full max-w-[1280px] flex-col gap-8">
            <section className="rounded-[28px] border border-gray-200 bg-white px-6 py-8 shadow-sm dark:border-gray-800 dark:bg-surface-dark md:px-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                            {copy.label}
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-main dark:text-white">
                            {category.name}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm text-text-sub dark:text-gray-400">
                            {copy.description}
                        </p>
                    </div>
                    <div className="inline-flex items-center rounded-full border border-gray-200 bg-background-light px-4 py-2 text-sm font-medium text-text-sub dark:border-gray-700 dark:bg-background-dark dark:text-gray-300">
                        {copy.count}
                    </div>
                </div>
            </section>

            {posts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 px-6 py-12 text-center dark:border-gray-700 dark:bg-surface-dark/60">
                    <h2 className="text-lg font-semibold text-text-main dark:text-white">
                        {copy.emptyTitle}
                    </h2>
                    <p className="mt-2 text-sm text-text-sub dark:text-gray-400">
                        {copy.emptyBody}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-4">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
}
