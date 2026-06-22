"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/locale-provider";
import { withLocale } from "@/lib/i18n/config";
import type { TocItem } from "@/lib/content-transform";

/**
 * Reusable card wrapper for sidebar sections.
 */
export function SidebarCard({
  title,
  icon,
  children,
}: Readonly<{
  title: string;
  icon?: string;
  children: React.ReactNode;
}>) {
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
 * Sticky sidebar with the article TOC and popular posts.
 */
export function PostSidebar({
  derivedTocItems,
  scrollToHeading,
  effectiveActiveTocId,
  popularPosts,
}: any) {
  const locale = useLocale();

  return (
    <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
      <div className="space-y-5">
        <SidebarCard title="On this page" icon="toc">
          {derivedTocItems.length ? (
            <ul className="space-y-1">
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
