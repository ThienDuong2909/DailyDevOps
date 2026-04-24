"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/locale-provider";
import { withLocale } from "@/lib/i18n/config";
import { formatDate, getImageUrl } from "@/lib/utils";
import type { TocItem } from "@/lib/content-transform";

/**
 * Reusable card wrapper for sidebar sections.
 */
export function SidebarCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="theme-surface rounded-2xl p-5">
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[color:var(--text-main-theme)]">
        {icon ? (
          <span className="material-symbols-outlined !text-[18px] text-primary">
            {icon}
          </span>
        ) : null}
        {title}
      </h3>
      {children}
    </div>
  );
}

/**
 * Sticky sidebar with TOC, article snapshot, share tools,
 * related posts, and popular posts.
 */
export function PostSidebar({
  derivedTocItems,
  tocNavRef,
  scrollToHeading,
  effectiveActiveTocId,
  post,
  handleShare,
  relatedPosts,
  popularPosts,
}: any) {
  const locale = useLocale();

  return (
    <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
      <div className="space-y-5">
        <SidebarCard title="On this page" icon="toc">
          {derivedTocItems.length ? (
            <ul
              ref={tocNavRef}
              className="custom-scrollbar max-h-[60vh] space-y-1 overflow-y-auto pr-1"
            >
              {derivedTocItems.map((item: TocItem) => (
                <li key={item.id}>
                  <button
                    type="button"
                    data-toc-id={item.id}
                    onClick={() => scrollToHeading(item.id)}
                    className={`flex w-full items-start rounded-lg border-l-2 px-3 py-2 text-left transition-all duration-200 ${
                      effectiveActiveTocId === item.id
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent theme-muted hover:border-primary/40 hover:text-primary"
                    } ${item.level === 3 ? "ml-4 text-[13px]" : "text-sm"}`}
                    style={
                      effectiveActiveTocId === item.id
                        ? {
                            background:
                              "color-mix(in srgb, var(--primary-theme) 8%, transparent)",
                          }
                        : undefined
                    }
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="theme-muted text-sm">No headings found</p>
          )}
        </SidebarCard>
        <SidebarCard title="Article snapshot" icon="info">
          <div className="space-y-3 text-sm">
            {[
              {
                label: "Published",
                value: formatDate(post.publishedAt || post.createdAt),
                icon: "calendar_month",
              },
              {
                label: "Reading time",
                value: `${post.readingTime || 5} min`,
                icon: "schedule",
              },
              {
                label: "Views",
                value: String(post.viewCount || 0),
                icon: "visibility",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4"
              >
                <span className="theme-muted flex items-center gap-1.5">
                  <span className="material-symbols-outlined !text-[16px] theme-soft">
                    {row.icon}
                  </span>
                  {row.label}
                </span>
                <span className="font-semibold text-[color:var(--text-main-theme)]">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </SidebarCard>

        <SidebarCard title="Share and explore" icon="explore">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {post.tags?.map((tag: any) => (
                <Link
                  key={`sidebar-${tag.id}`}
                  href={withLocale(`/tag/${tag.slug}`, locale)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-[color:var(--text-main-theme)] transition-colors hover:text-primary"
                  style={{ border: "1px solid var(--border-soft-theme)" }}
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => {
                  handleShare("copy");
                }}
                className="theme-glow-button inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-opacity hover:opacity-90"
              >
                <span className="material-symbols-outlined !text-[18px]">
                  link
                </span>
                Copy article link
              </button>
              {post.category ? (
                <Link
                  href={withLocale(`/category/${post.category.slug}`, locale)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-[color:var(--text-main-theme)] transition-colors hover:text-primary"
                  style={{ border: "1px solid var(--border-soft-theme)" }}
                >
                  <span className="material-symbols-outlined !text-[18px]">
                    category
                  </span>
                  More in {post.category.name}
                </Link>
              ) : null}
            </div>
          </div>
        </SidebarCard>

        <SidebarCard title="Continue reading" icon="auto_stories">
          {relatedPosts.length ? (
            <div className="space-y-1">
              {relatedPosts.map((item: any) => (
                <Link
                  key={item.id}
                  href={withLocale(`/${item.slug}`, locale)}
                  className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:text-primary"
                  style={
                    {
                      "--hover-bg":
                        "color-mix(in srgb, var(--primary-theme) 6%, transparent)",
                    } as React.CSSProperties
                  }
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "color-mix(in srgb, var(--primary-theme) 6%, transparent)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {item.featuredImage ? (
                    <img
                      src={getImageUrl(item.featuredImage)}
                      alt=""
                      className="size-10 shrink-0 rounded-lg object-cover"
                      style={{ border: "1px solid var(--border-ghost-theme)" }}
                    />
                  ) : (
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: "var(--surface-muted)",
                        border: "1px solid var(--border-ghost-theme)",
                      }}
                    >
                      <span className="material-symbols-outlined !text-[16px] theme-soft">
                        article
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold text-[color:var(--text-main-theme)]">
                      {item.title}
                    </p>
                    <p className="theme-soft mt-0.5 text-xs">
                      {item.readingTime || 5} min read
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="theme-muted text-sm">
              More articles in this topic will appear here as related content
              grows.
            </p>
          )}
        </SidebarCard>

        <SidebarCard title="Popular now" icon="trending_up">
          {popularPosts.length ? (
            <div className="space-y-1">
              {popularPosts.map((item: any, index: number) => (
                <Link
                  key={`popular-${item.id}`}
                  href={withLocale(`/${item.slug}`, locale)}
                  className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:text-primary"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "color-mix(in srgb, var(--primary-theme) 6%, transparent)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-primary"
                    style={{
                      background:
                        "color-mix(in srgb, var(--primary-theme) 10%, var(--surface-muted))",
                    }}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold text-[color:var(--text-main-theme)]">
                      {item.title}
                    </p>
                    <p className="theme-soft mt-0.5 text-xs">
                      {item.viewCount || 0} views
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="theme-muted text-sm">
              Popular posts are loading from the public feed.
            </p>
          )}
        </SidebarCard>
      </div>
    </aside>
  );
}
