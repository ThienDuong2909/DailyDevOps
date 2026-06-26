import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/blog/post-card";
import { normalizeLocale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { getImageUrl } from "@/lib/utils";
import type { Post } from "@/types";

const apiBaseUrl =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

interface PublicAuthor {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  role: string;
  createdAt: string;
  posts: Post[];
}

async function fetchAuthor(username: string): Promise<PublicAuthor | null> {
  try {
    const response = await fetch(
      `${apiBaseUrl}/api/v1/users/public/${encodeURIComponent(username)}`,
      {
        next: { revalidate: 300 },
      },
    );

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    return json.data || null;
  } catch {
    return null;
  }
}

function sortPostsNewestFirst(posts: Post[]) {
  return [...posts].sort(
    (left, right) =>
      new Date(right.publishedAt || right.createdAt).getTime() -
      new Date(left.publishedAt || left.createdAt).getTime(),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; locale?: string }>;
}): Promise<Metadata> {
  const { username, locale } = await params;
  const resolvedLocale = locale
    ? normalizeLocale(locale)
    : await getRequestLocale();
  const author = await fetchAuthor(username);

  if (!author) {
    return {
      title:
        resolvedLocale === "en" ? "Author Not Found" : "Không tìm thấy tác giả",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const authorName = `${author.firstName} ${author.lastName}`;

  return {
    title:
      resolvedLocale === "en"
        ? `${authorName} Author Profile`
        : `Trang tác giả ${authorName}`,
    description:
      author.bio ||
      (resolvedLocale === "en"
        ? `Read published DevOps Daily articles written by ${authorName}.`
        : `Khám phá các bài viết Daily DevOps được viết bởi ${authorName}.`),
    alternates: {
      canonical:
        resolvedLocale === "vi"
          ? `/author/${username}`
          : `/${resolvedLocale}/author/${username}`,
    },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ username: string; locale?: string }>;
}) {
  const { username, locale } = await params;
  const resolvedLocale = locale
    ? normalizeLocale(locale)
    : await getRequestLocale();
  const author = await fetchAuthor(username);

  if (!author) {
    notFound();
  }

  const authorName = `${author.firstName} ${author.lastName}`;

  const posts = sortPostsNewestFirst(author.posts);
  const copy =
    resolvedLocale === "en"
      ? {
          label: "Author",
          description:
            author.bio ||
            `${authorName} contributes published articles to DevOps Daily.`,
          count: `${posts.length} published articles`,
          emptyTitle: "This author has no public articles yet",
          emptyBody: "When new posts are published, they will appear here.",
        }
      : {
          label: "Tác giả",
          description:
            author.bio ||
            `${authorName} đang đóng góp các bài viết cho DevOps Daily.`,
          count: `${posts.length} bài viết đã xuất bản`,
          emptyTitle: "Tác giả này chưa có bài viết công khai",
          emptyBody:
            "Khi bài viết mới được publish, chúng sẽ hiển thị tại đây.",
        };

  return (
    <div className="flex w-full max-w-[1280px] flex-col gap-8">
      <section className="rounded-[28px] border border-gray-200 bg-white px-6 py-8 shadow-sm dark:border-gray-800 dark:bg-surface-dark md:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {author.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getImageUrl(author.avatar)}
                alt={authorName}
                className="h-full w-full object-cover"
              />
            ) : (
              `${author.firstName?.[0] || ""}${author.lastName?.[0] || ""}`
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {copy.label}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-main dark:text-white">
              {authorName}
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
