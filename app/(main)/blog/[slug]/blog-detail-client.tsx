"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useScrollSpy } from "@/hooks/use-scroll-spy";
import { useCommentForm } from "@/hooks/use-comment-form";
import { useReadingProgress, usePostActions } from "@/hooks/use-post-actions";
import { formatDate, getImageUrl } from "@/lib/utils";
import type { Post, PostWithComments } from "@/types";

const NON_AUTHOR_SLUG_CHARACTERS_REGEX = /[^a-z0-9\s-]/g;
const AUTHOR_WHITESPACE_REGEX = /\s+/g;
const AUTHOR_REPEATED_HYPHENS_REGEX = /-+/g;

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
    relatedPosts,
    popularPosts,
    loading,
    errorMessage,
    translationNotice,
  } = useFetchPostData(slug, {
    post: initialPost ?? undefined,
    relatedPosts: initialRelatedPosts,
    popularPosts: initialPopularPosts,
  });
  const progress = useReadingProgress();
  const [activeTocId, setActiveTocId] = useState("");

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

      setActiveTocId(headingId);
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
  const effectiveActiveTocId = activeTocId || derivedTocItems[0]?.id || "";

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

  useEffect(() => {
    if (!activeTocId && derivedTocItems[0]?.id) {
      setActiveTocId(derivedTocItems[0].id);
    }
  }, [activeTocId, derivedTocItems]);

  const tocNavRef = useRef<HTMLUListElement>(null);

  // Auto-scroll active TOC item into view within the sidebar
  useEffect(() => {
    if (!activeTocId || !tocNavRef.current) return;
    const activeBtn = tocNavRef.current.querySelector<HTMLElement>(
      `[data-toc-id="${activeTocId}"]`,
    );
    if (activeBtn) {
      activeBtn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeTocId]);

  useScrollSpy({
    contentRef,
    derivedTocItems,
    setActiveTocId,
    scrollToHeading,
  });

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

      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

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
            derivedTocItems={derivedTocItems}
            tocNavRef={tocNavRef}
            scrollToHeading={scrollToHeading}
            effectiveActiveTocId={effectiveActiveTocId}
            post={post}
            handleShare={handleShare}
            relatedPosts={relatedPosts}
            popularPosts={popularPosts}
          />
        </div>
      </section>

      <style jsx global>{`
        .article-copy {
          color: var(--text-muted-theme);
          font-size: 16px;
          line-height: 1.95;
          max-width: 100%;
          overflow-wrap: anywhere;
          word-break: break-word;
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
          color: var(--text-main-theme);
          scroll-margin-top: 8rem;
          overflow-wrap: anywhere;
        }
        .article-copy .heading-anchor-link {
          margin-left: 0.5rem;
          color: #137fec;
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
          color: var(--text-main-theme);
        }
        .article-copy em {
          font-style: italic;
        }
        .article-copy u {
          text-decoration: underline;
          text-underline-offset: 0.2em;
        }
        .article-copy a {
          color: #137fec;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 0.2em;
        }
        .article-copy blockquote {
          margin: 1.5rem 0;
          border-left: 3px solid #137fec;
          padding-left: 1rem;
          color: var(--text-muted-theme);
          font-style: italic;
        }
        .article-copy code {
          background: color-mix(
            in srgb,
            var(--primary-theme) 10%,
            var(--surface-muted)
          );
          color: var(--text-main-theme);
          border-radius: 0.375rem;
          padding: 0.15rem 0.4rem;
          font-family: "JetBrains Mono", monospace;
          font-size: 0.92em;
        }
        .article-copy pre {
          margin: 1.75rem 0;
          max-width: 100%;
          overflow-x: auto;
          border-radius: 1rem;
          background: color-mix(in srgb, var(--surface-strong) 88%, black 12%);
          border: 1px solid var(--border-soft-theme);
          color: #e6eef8;
        }
        .article-copy pre code {
          display: block;
          background: transparent;
          color: inherit;
          border-radius: 0;
          padding: 1.1rem 1.25rem;
          white-space: pre;
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
