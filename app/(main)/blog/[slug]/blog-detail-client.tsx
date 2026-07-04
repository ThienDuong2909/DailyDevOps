"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useDictionary, useLocale } from "@/components/i18n/locale-provider";
import { withLocale } from "@/lib/i18n/config";
import {
  transformPostContent,
  normalizeContentHeadings,
} from "@/lib/content-transform";
import { PostDetailSkeleton } from "@/components/blog/detail/post-detail-skeleton";
import {
  BlogPostJsonLd,
  BreadcrumbJsonLd,
} from "@/components/blog/detail/post-json-ld";
import { NewsletterSection } from "@/components/blog/detail/newsletter-section";
import { PostComments } from "@/components/blog/detail/post-comments";
import { PostSidebar } from "@/components/blog/detail/post-sidebar";
import { useAuthStore } from "@/hooks/use-auth";
import { useFetchPostData } from "@/hooks/use-fetch-post";
import { useCommentForm } from "@/hooks/use-comment-form";
import { usePostActions } from "@/hooks/use-post-actions";
import { formatDate, getImageUrl } from "@/lib/utils";
import type { Post, PostWithComments } from "@/types";

const NON_AUTHOR_SLUG_CHARACTERS_REGEX = /[^a-z0-9\s-]/g;
const AUTHOR_WHITESPACE_REGEX = /\s+/g;
const AUTHOR_REPEATED_HYPHENS_REGEX = /-+/g;

function ReadingProgressBar() {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId = 0;

    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(
        100,
        max > 0 ? (window.scrollY / max) * 100 : 0,
      );
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress / 100})`;
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-transparent">
      <div
        ref={progressRef}
        className="h-full origin-left scale-x-0 bg-gradient-to-r from-primary to-cyan-400 transition-transform duration-150 ease-out"
      />
    </div>
  );
}

function buildAuthorUsername(firstName: string, lastName: string) {
  let slug = `${firstName || ""} ${lastName || ""}`
    .trim()
    .toLowerCase()
    .replaceAll(NON_AUTHOR_SLUG_CHARACTERS_REGEX, "")
    .replaceAll(AUTHOR_WHITESPACE_REGEX, "-")
    .replaceAll(AUTHOR_REPEATED_HYPHENS_REGEX, "-");

  while (slug.startsWith("-")) {
    slug = slug.slice(1);
  }

  while (slug.endsWith("-")) {
    slug = slug.slice(0, -1);
  }

  return slug;
}

export default function BlogDetailClient({
  slugOverride,
  initialPost,
  initialRelatedPosts,
  initialPopularPosts,
}: {
  slugOverride?: string;
  initialPost?: PostWithComments | null;
  initialRelatedPosts?: Post[];
  initialPopularPosts?: Post[];
} = {}) {
  const params = useParams<{ slug?: string; segments?: string[] }>();
  const routeSlug =
    params?.slug ||
    (Array.isArray(params?.segments) ? (params.segments.at(-1) ?? "") : "");
  const slug = slugOverride || routeSlug;
  const locale = useLocale();
  const dictionary = useDictionary();
  const { user, isAuthenticated, initializeAuth } = useAuthStore();
  const {
    post,
    setPost,
    popularPosts,
    loading,
    errorMessage,
    translationNotice,
  } = useFetchPostData(slug, {
    post: initialPost ?? undefined,
    relatedPosts: initialRelatedPosts,
    popularPosts: initialPopularPosts,
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const siteUrl = "https://dailydevops.blog";
  const localizedPostPath = withLocale(`/${slug}`, locale);
  const postUrl = `${siteUrl}${localizedPostPath}`;

  const { form, setForm, submitting, handleCommentSubmit } = useCommentForm(
    post,
    setPost,
    isAuthenticated,
  );
  const { handleContentClick, handleShare } = usePostActions(
    postUrl,
    post?.title,
    post?.excerpt,
  );

  const scrollToHeading = useCallback(
    (headingId: string, options?: { updateHash?: boolean }) => {
      const heading = globalThis.document.getElementById(headingId);
      if (!heading) return;

      if (options?.updateHash !== false) {
        const targetUrl = `${globalThis.window.location.pathname}#${headingId}`;
        globalThis.window.history.replaceState(
          globalThis.window.history.state ?? {},
          "",
          targetUrl,
        );
      }

      heading.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [],
  );

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const primaryContent = post?.contentHtml || post?.content || "";

  const transformedContent = useMemo(
    () => transformPostContent(primaryContent),
    [primaryContent],
  );

  const normalizedContent = useMemo(
    () => normalizeContentHeadings(transformedContent),
    [transformedContent],
  );
  const formattedContent = normalizedContent.html;
  const derivedTocItems = normalizedContent.toc;

  useEffect(() => {
    const contentNode = contentRef.current;

    if (!contentNode) {
      return;
    }

    const onContentClick = (event: MouseEvent) => {
      handleContentClick(event);
    };

    contentNode.addEventListener("click", onContentClick);

    return () => {
      contentNode.removeEventListener("click", onContentClick);
    };
  }, [formattedContent, handleContentClick]);

  if (loading) return <PostDetailSkeleton />;

  if (!post) {
    return (
      <div className="theme-shell flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined mb-4 !text-[56px] theme-soft">
            search_off
          </span>
          <h1 className="mb-3 text-3xl font-bold text-[color:var(--text-main-theme)]">
            {translationNotice
              ? dictionary.common.translationMissing
              : errorMessage || dictionary.common.articleNotFound}
          </h1>
          <p className="theme-muted mb-6 text-sm">
            {dictionary.blog.missingPostBody}
          </p>
          {translationNotice ? (
            <Link
              href={withLocale(
                `/${translationNotice.sourceSlug}`,
                translationNotice.sourceLocale,
              )}
              className="mr-3 inline-flex h-11 items-center rounded-xl border border-[var(--border-soft-theme)] px-6 text-sm font-semibold text-[color:var(--text-main-theme)] transition-colors hover:border-primary hover:text-primary"
            >
              {dictionary.common.switchToVietnamese}
            </Link>
          ) : null}
          <Link
            href={withLocale("/blog", locale)}
            className="inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            {dictionary.common.browseArticles}
          </Link>
        </div>
      </div>
    );
  }

  const authorName = `${post.author.firstName} ${post.author.lastName}`;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--surface-muted)",
        color: "var(--text-main-theme)",
      }}
    >
      {/* JSON-LD Structured Data */}
      <BlogPostJsonLd post={post} postUrl={postUrl} />
      <BreadcrumbJsonLd post={post} siteUrl={siteUrl} locale={locale} />

      <ReadingProgressBar />

      <section className="mx-auto max-w-[1280px] overflow-x-clip px-4 pt-6 sm:pt-8 lg:px-8 lg:pt-10">
        <nav className="theme-muted mb-6 flex flex-wrap items-center gap-2 pb-1 text-sm">
          <Link
            href={withLocale("/", locale)}
            className="shrink-0 hover:text-primary"
          >
            {dictionary.common.blog}
          </Link>
          <span className="material-symbols-outlined shrink-0 text-sm">
            chevron_right
          </span>
          {post.category ? (
            <>
              <span className="shrink-0">{post.category.name}</span>
              <span className="material-symbols-outlined shrink-0 text-sm">
                chevron_right
              </span>
            </>
          ) : null}
          <span className="text-[color:var(--text-main-theme)] break-words">
            {post.title}
          </span>
        </nav>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
          <div className="min-w-0">
            <h1 className="mb-5 break-words text-[2rem] font-bold leading-[1.2] tracking-[-0.01em] text-[color:var(--text-main-theme)] sm:text-[30px]">
              {post.title}
            </h1>
            <div
              className="mb-8 flex flex-wrap items-center gap-4 border-b pb-6"
              style={{ borderColor: "var(--border-soft-theme)" }}
            >
              <div
                className="size-12 shrink-0 rounded-full bg-cover bg-center ring-2 ring-[color:var(--border-soft-theme)]"
                style={{
                  backgroundImage: `url("${getImageUrl(post.author.avatar) || "/avatar-placeholder.jpg"}")`,
                }}
              />
              <div className="min-w-0">
                <Link
                  href={withLocale(
                    `/author/${buildAuthorUsername(post.author.firstName, post.author.lastName)}`,
                    locale,
                  )}
                  className="block truncate font-semibold text-[color:var(--text-main-theme)] transition-colors hover:text-primary"
                >
                  {authorName}
                </Link>
                <p className="theme-muted mt-0.5 flex flex-wrap items-center gap-y-1 text-sm">
                  {formatDate(post.publishedAt || post.createdAt)}
                  <span
                    className="mx-1.5 inline-block size-1 rounded-full align-middle"
                    style={{ background: "var(--text-soft-theme)" }}
                  />
                  {post.readingTime || 5} min read
                  <span
                    className="mx-1.5 inline-block size-1 rounded-full align-middle"
                    style={{ background: "var(--text-soft-theme)" }}
                  />
                  {post.viewCount || 0} views
                </p>
              </div>
            </div>

            <div className="mb-8 flex flex-wrap items-center gap-2.5">
              {post.category ? (
                <Link
                  href={withLocale(`/category/${post.category.slug}`, locale)}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: post.category.color
                      ? `${post.category.color}1a`
                      : "color-mix(in srgb, var(--primary-theme) 12%, var(--surface-muted))",
                    color: post.category.color || "var(--primary-theme)",
                  }}
                >
                  <span className="material-symbols-outlined !text-[14px]">
                    folder
                  </span>
                  {post.category.name}
                </Link>
              ) : null}
              {post.tags?.map((tag) => (
                <Link
                  key={tag.id}
                  href={withLocale(`/tag/${tag.slug}`, locale)}
                  className="inline-flex rounded-full px-4 py-2 text-xs font-semibold text-[color:var(--text-main-theme)] transition-colors hover:text-primary"
                  style={{ border: "1px solid var(--border-soft-theme)" }}
                >
                  #{tag.name}
                </Link>
              ))}
            </div>

            {post.featuredImage ? (
              <div
                className="mb-10 overflow-hidden rounded-2xl"
                style={{ border: "1px solid var(--border-soft-theme)" }}
              >
                <img
                  src={getImageUrl(post.featuredImage)}
                  alt={post.title}
                  className="aspect-[21/9] w-full object-cover"
                />
              </div>
            ) : null}

            <div
              ref={contentRef}
              className="article-copy min-w-0 max-w-none overflow-x-hidden"
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />

            <NewsletterSection />
            <PostComments
              post={post}
              isAuthenticated={isAuthenticated}
              user={user}
              form={form}
              setForm={setForm}
              submitting={submitting}
              handleCommentSubmit={handleCommentSubmit}
              handleShare={handleShare}
            />
          </div>

          <PostSidebar
            contentRef={contentRef}
            derivedTocItems={derivedTocItems}
            scrollToHeading={scrollToHeading}
            popularPosts={popularPosts}
          />
        </div>
      </section>

      <style jsx global>{`
        .article-copy {
          --article-text: #334155;
          --article-heading: #0f172a;
          --article-muted: #52657d;
          --article-link: #0f6fdc;
          --article-link-hover: #0b58b0;
          --article-inline-code-bg: color-mix(
            in srgb,
            var(--primary-theme) 11%,
            #f8fafc
          );
          --article-inline-code-text: #0f4f9f;
          --article-quote-bg: color-mix(
            in srgb,
            var(--primary-theme) 7%,
            #ffffff
          );
          --code-window-bg: #172235;
          --code-window-header: #111a2b;
          --code-window-border: rgba(15, 111, 220, 0.18);
          --code-window-text: #e6edf7;
          --code-window-muted: #95a8bf;
          --code-window-button: rgba(255, 255, 255, 0.07);
          --code-window-button-hover: rgba(19, 127, 236, 0.2);
          color: var(--article-text);
          font-size: 16px;
          line-height: 1.95;
          max-width: 100%;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .dark .article-copy {
          --article-text: #c8d4e4;
          --article-heading: #f4f8fc;
          --article-muted: #9dafc7;
          --article-link: #60a5fa;
          --article-link-hover: #93c5fd;
          --article-inline-code-bg: color-mix(
            in srgb,
            var(--primary-theme) 17%,
            var(--surface-strong)
          );
          --article-inline-code-text: #bfdbfe;
          --article-quote-bg: color-mix(
            in srgb,
            var(--primary-theme) 11%,
            var(--surface-muted)
          );
          --code-window-bg: #0d1728;
          --code-window-header: #111d30;
          --code-window-border: rgba(96, 165, 250, 0.2);
          --code-window-text: #dbeafe;
          --code-window-muted: #8ea2bd;
          --code-window-button: rgba(255, 255, 255, 0.075);
          --code-window-button-hover: rgba(59, 130, 246, 0.22);
        }
        .article-copy > * {
          max-width: 100%;
        }
        .article-copy h2,
        .article-copy h3 {
          position: relative;
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-size: 22px;
          font-weight: 700;
          line-height: 1.5;
          color: var(--article-heading);
          scroll-margin-top: 8rem;
          overflow-wrap: anywhere;
        }
        .article-copy .heading-anchor-link {
          margin-left: 0.5rem;
          color: var(--article-link);
          opacity: 0;
          text-decoration: none;
          transition: opacity 0.18s ease;
          font-weight: 700;
        }
        .article-copy h2:hover .heading-anchor-link,
        .article-copy h3:hover .heading-anchor-link,
        .article-copy .heading-anchor-link:focus {
          opacity: 1;
        }
        .article-copy p,
        .article-copy li {
          margin-bottom: 1rem;
          font-size: 16px;
          line-height: 1.95;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .article-copy ul,
        .article-copy ol {
          margin: 1rem 0 1.5rem;
          padding-left: 1.5rem;
        }
        .article-copy strong {
          font-weight: 700;
          color: var(--article-heading);
        }
        .article-copy em {
          font-style: italic;
        }
        .article-copy u {
          text-decoration: underline;
          text-underline-offset: 0.2em;
        }
        .article-copy a {
          color: var(--article-link);
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 0.2em;
          text-decoration-color: color-mix(
            in srgb,
            var(--article-link) 42%,
            transparent
          );
          transition:
            color 0.18s ease,
            text-decoration-color 0.18s ease;
        }
        .article-copy a:hover {
          color: var(--article-link-hover);
          text-decoration-color: currentColor;
        }
        .article-copy blockquote {
          margin: 1.5rem 0;
          border-left: 4px solid var(--article-link);
          border-radius: 0 1rem 1rem 0;
          background: var(--article-quote-bg);
          padding: 0.95rem 1rem;
          color: var(--article-muted);
          font-style: italic;
        }
        .article-copy code {
          background: var(--article-inline-code-bg);
          color: var(--article-inline-code-text);
          border: 1px solid
            color-mix(in srgb, var(--primary-theme) 14%, transparent);
          border-radius: 0.5rem;
          padding: 0.15rem 0.4rem;
          font-family: "JetBrains Mono", monospace;
          font-size: 0.9em;
          font-weight: 600;
        }
        .article-copy pre {
          margin: 0;
          max-width: 100%;
          overflow-x: auto;
          border: 0;
          border-radius: 0;
          background: transparent;
          color: inherit;
        }
        .article-copy pre code {
          display: block;
          background: transparent;
          border: 0;
          color: inherit;
          border-radius: 0;
          padding: 1.2rem 1.25rem;
          white-space: pre;
          font-weight: 500;
        }
        .article-copy .macos-mockup {
          margin: 1.9rem 0;
          overflow: hidden;
          border: 1px solid var(--code-window-border);
          border-radius: 0.75rem;
          background: var(--code-window-bg);
          color: var(--code-window-text);
          box-shadow:
            0 18px 42px rgba(15, 23, 42, 0.12),
            0 1px 0 rgba(255, 255, 255, 0.04) inset;
          font-family: "JetBrains Mono", monospace;
          overflow-wrap: normal;
          word-break: normal;
        }
        .dark .article-copy .macos-mockup {
          box-shadow:
            0 22px 54px rgba(0, 0, 0, 0.28),
            0 1px 0 rgba(255, 255, 255, 0.04) inset;
        }
        .article-copy .macos-titlebar {
          display: flex;
          min-height: 2.5rem;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          border-bottom: 1px solid var(--code-window-border);
          background:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.055),
              rgba(255, 255, 255, 0)
            ),
            var(--code-window-header);
          padding: 0.55rem 0.75rem 0.55rem 0.9rem;
        }
        .article-copy .macos-window-dots,
        .article-copy .macos-window-actions {
          display: inline-flex;
          align-items: center;
        }
        .article-copy .macos-window-dots {
          gap: 0.45rem;
          flex: 0 0 auto;
        }
        .article-copy .macos-dot {
          height: 0.72rem;
          width: 0.72rem;
          border-radius: 9999px;
          box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.16) inset;
        }
        .article-copy .macos-dot-red {
          background: #ff5f57;
        }
        .article-copy .macos-dot-yellow {
          background: #febc2e;
        }
        .article-copy .macos-dot-green {
          background: #28c840;
        }
        .article-copy .macos-window-actions {
          min-width: 0;
          gap: 0.65rem;
        }
        .article-copy .macos-language {
          max-width: 10rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--code-window-muted);
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .article-copy .copy-code-btn {
          display: inline-flex;
          height: 1.7rem;
          align-items: center;
          border: 1px solid rgba(255, 255, 255, 0.11);
          border-radius: 0.45rem;
          background: var(--code-window-button);
          color: #d8e4f2;
          cursor: pointer;
          font-family: var(--font-inter), "Inter", sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          line-height: 1;
          padding: 0 0.65rem;
          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            color 0.18s ease;
        }
        .article-copy .copy-code-btn:hover,
        .article-copy .copy-code-btn:focus-visible {
          border-color: color-mix(
            in srgb,
            var(--article-link) 36%,
            rgba(255, 255, 255, 0.18)
          );
          background: var(--code-window-button-hover);
          color: #ffffff;
          outline: none;
        }
        .article-copy .code-wrapper-scroll {
          overflow-x: auto;
          background: var(--code-window-bg);
          color: var(--code-window-text);
          font-size: 0.86rem;
          line-height: 1.75;
          -webkit-overflow-scrolling: touch;
        }
        .article-copy .macos-code-content {
          color: var(--code-window-text);
          text-shadow: 0 1px 0 rgba(0, 0, 0, 0.14);
        }
        .article-copy img,
        .article-copy video,
        .article-copy canvas,
        .article-copy svg,
        .article-copy iframe {
          display: block;
          max-width: 100%;
          height: auto;
        }
        .article-copy img {
          border-radius: 1rem;
          border: 1px solid var(--border-soft-theme);
          margin: 1.5rem auto;
        }
        .article-copy img[data-align="left"] {
          margin-left: 0;
          margin-right: auto;
        }
        .article-copy img[data-align="right"] {
          margin-left: auto;
          margin-right: 0;
        }
        .article-copy img[data-align="center"] {
          margin-left: auto;
          margin-right: auto;
        }
        .article-copy .macos-mockup,
        .article-copy .code-wrapper-scroll,
        .article-copy table,
        .article-copy figure,
        .article-copy .resizable-image-node {
          max-width: 100%;
        }
        .article-copy table {
          display: block;
          width: 100%;
          margin: 1.75rem 0;
          border-collapse: collapse;
          overflow-x: auto;
          overflow-y: hidden;
          border: 1px solid var(--border-soft-theme);
          border-radius: 1rem;
          table-layout: fixed;
          -webkit-overflow-scrolling: touch;
        }
        .article-copy th,
        .article-copy td {
          border-bottom: 1px solid var(--border-ghost-theme);
          padding: 0.9rem 1rem;
          vertical-align: top;
        }
        .article-copy th {
          background: var(--surface-muted);
          color: var(--text-muted-theme);
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
        }
        .article-copy td {
          color: var(--text-main-theme);
        }
        .article-copy td p:last-child,
        .article-copy th p:last-child {
          margin-bottom: 0;
        }
        @media (max-width: 640px) {
          .article-copy {
            font-size: 15px;
            line-height: 1.85;
          }
          .article-copy h2,
          .article-copy h3 {
            font-size: 1.75rem;
            line-height: 1.3;
          }
          .article-copy pre code {
            padding: 0.95rem 1rem;
            font-size: 12px;
          }
          .article-copy table {
            font-size: 14px;
          }
          .article-copy th,
          .article-copy td {
            padding: 0.75rem;
          }
          .article-copy .heading-anchor-link {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
