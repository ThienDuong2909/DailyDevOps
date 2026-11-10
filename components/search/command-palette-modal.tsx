"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Folder,
  Hash,
  FileText,
  CornerDownLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  getSearchEngine,
  loadSearchIndex,
  highlightText,
  type GroupedSearchResults,
} from "@/lib/search/search-engine";
import { withLocale } from "@/lib/i18n/config";
import type { SiteLocale } from "@/lib/i18n/config";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: SiteLocale;
}

interface SelectableItem {
  id: string;
  type: "category" | "tag" | "post" | "view-all";
  title: string;
  href: string;
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  locale,
}: CommandPaletteModalProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GroupedSearchResults>({
    posts: [],
    categories: [],
    tags: [],
    totalMatches: 0,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Initialize and preload the search index
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const engine = getSearchEngine();

    if (!engine.isReady() || engine.getLocale() !== locale) {
      setIsLoading(true);
      loadSearchIndex(locale)
        .then(() => {
          if (isMounted) {
            setIsLoading(false);
            if (query.trim()) {
              setResults(engine.search(query, { limit: 8 }));
            }
          }
        })
        .catch(() => {
          if (isMounted) setIsLoading(false);
        });
    }

    // Auto-focus input on open
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, locale, query]);

  // Execute in-memory search on query change (0ms latency)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ posts: [], categories: [], tags: [], totalMatches: 0 });
      setSelectedIndex(0);
      return;
    }

    const engine = getSearchEngine();
    if (engine.isReady()) {
      const searchRes = engine.search(trimmed, { limit: 8 });
      setResults(searchRes);
      setSelectedIndex(0);
    }
  }, [query]);

  // Build a flat list of selectable items for keyboard navigation
  const selectableItems = useMemo<SelectableItem[]>(() => {
    const items: SelectableItem[] = [];

    // Categories
    for (const cat of results.categories) {
      items.push({
        id: `cat-${cat.slug}`,
        type: "category",
        title: cat.name,
        href: withLocale(`/category/${cat.slug}`, locale),
      });
    }

    // Tags
    for (const tag of results.tags) {
      items.push({
        id: `tag-${tag.slug}`,
        type: "tag",
        title: `#${tag.name}`,
        href: withLocale(`/search?tag=${encodeURIComponent(tag.name)}`, locale),
      });
    }

    // Posts
    for (const post of results.posts) {
      items.push({
        id: `post-${post.id}`,
        type: "post",
        title: post.title,
        href: withLocale(`/${post.slug}`, locale),
      });
    }

    // "View all" action
    if (query.trim()) {
      items.push({
        id: "action-view-all",
        type: "view-all",
        title: `Xem tất cả kết quả cho "${query.trim()}"`,
        href: withLocale(
          `/search?q=${encodeURIComponent(query.trim())}`,
          locale,
        ),
      });
    }

    return items;
  }, [results, query, locale]);

  // Navigate to selected item
  const handleSelectItem = useCallback(
    (item: SelectableItem) => {
      onClose();
      startTransition(() => {
        router.push(item.href);
      });
    },
    [onClose, router],
  );

  // Keyboard navigation inside modal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (selectableItems.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < selectableItems.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : selectableItems.length - 1,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = selectableItems[selectedIndex];
        if (selected) {
          handleSelectItem(selected);
        }
      }
    },
    [selectableItems, selectedIndex, handleSelectItem, onClose],
  );

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setSelectedIndex(0);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Trending / Suggestion quick-search keywords
  const popularKeywords = [
    "Docker",
    "Kubernetes",
    "CI/CD",
    "Ansible",
    "Prometheus",
    "Linux",
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-12 sm:p-6 sm:pt-20"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Box */}
      <div
        className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-soft-theme)] bg-[var(--surface-elevated)] shadow-2xl transition-all animate-in zoom-in-95 duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-[var(--border-soft-theme)] px-4 py-3.5 sm:px-5">
          <Search className="size-5 shrink-0 text-[var(--text-soft-theme)]" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 border-none bg-transparent px-3 text-base font-medium text-[var(--text-main-theme)] placeholder:text-[var(--text-soft-theme)] focus:outline-none focus:ring-0 sm:text-lg"
            placeholder={
              locale === "vi"
                ? "Tìm kiếm bài viết, chuyên mục, công nghệ..."
                : "Search articles, categories, tools..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {isLoading && (
            <Loader2 className="size-4 animate-spin text-[var(--primary-theme)] mr-2" />
          )}

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="mr-2 rounded-lg p-1 text-[var(--text-soft-theme)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-main-theme)]"
              aria-label="Xóa tìm kiếm"
            >
              <X className="size-4" />
            </button>
          )}

          <kbd className="hidden rounded-lg border border-[var(--border-soft-theme)] bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted-theme)] sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results / Empty View Area */}
        <div
          ref={listRef}
          className="custom-scrollbar flex-1 overflow-y-auto p-3 sm:p-4"
        >
          {/* Query is empty: Show trending topics and hints */}
          {!query.trim() && (
            <div className="py-4 px-2">
              <div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted-theme)]">
                <Sparkles className="size-3.5 text-[var(--primary-theme)]" />
                <span>
                  {locale === "vi" ? "Chủ đề phổ biến" : "Popular Topics"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularKeywords.map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => setQuery(kw)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-soft-theme)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--text-main-theme)] transition-all hover:border-[var(--primary-theme)] hover:bg-[var(--primary-theme)]/10 hover:text-[var(--primary-theme)]"
                  >
                    <Hash className="size-3 text-[var(--text-soft-theme)]" />
                    {kw}
                  </button>
                ))}
              </div>

              <div className="mt-8 text-center text-xs text-[var(--text-soft-theme)]">
                {locale === "vi"
                  ? "Gõ từ khóa để tìm kiếm bài viết với tốc độ tức thì 0ms"
                  : "Type any term to search technical posts with 0ms latency"}
              </div>
            </div>
          )}

          {/* Results: Categories Section */}
          {results.categories.length > 0 && (
            <div className="mb-4">
              <div className="mb-1.5 px-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted-theme)]">
                {locale === "vi" ? "Chuyên mục" : "Categories"}
              </div>
              <div className="flex flex-col gap-1">
                {results.categories.map((cat) => {
                  const itemIndex = selectableItems.findIndex(
                    (it) => it.id === `cat-${cat.slug}`,
                  );
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() =>
                        handleSelectItem({
                          id: `cat-${cat.slug}`,
                          type: "category",
                          title: cat.name,
                          href: withLocale(`/category/${cat.slug}`, locale),
                        })
                      }
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                        isSelected
                          ? "bg-[var(--primary-theme)]/10 text-[var(--primary-theme)] font-semibold"
                          : "text-[var(--text-main-theme)] hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-[var(--primary-theme)]">
                          <Folder className="size-4" />
                        </div>
                        <span className="text-sm">{cat.name}</span>
                      </div>
                      <span className="text-xs text-[var(--text-soft-theme)]">
                        {locale === "vi" ? "Xem chuyên mục →" : "View hub →"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results: Tags Section */}
          {results.tags.length > 0 && (
            <div className="mb-4">
              <div className="mb-1.5 px-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted-theme)]">
                {locale === "vi" ? "Thẻ chủ đề" : "Tags"}
              </div>
              <div className="flex flex-wrap gap-1.5 px-2">
                {results.tags.map((tag) => {
                  const itemIndex = selectableItems.findIndex(
                    (it) => it.id === `tag-${tag.slug}`,
                  );
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <button
                      key={tag.slug}
                      type="button"
                      onClick={() =>
                        handleSelectItem({
                          id: `tag-${tag.slug}`,
                          type: "tag",
                          title: `#${tag.name}`,
                          href: withLocale(
                            `/search?tag=${encodeURIComponent(tag.name)}`,
                            locale,
                          ),
                        })
                      }
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-colors ${
                        isSelected
                          ? "bg-[var(--primary-theme)] text-white font-semibold"
                          : "bg-[var(--surface-muted)] text-[var(--text-main-theme)] hover:bg-[var(--surface-strong)]"
                      }`}
                    >
                      <Hash className="size-3" />
                      <span>{tag.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results: Articles Section */}
          {results.posts.length > 0 && (
            <div className="mb-2">
              <div className="mb-1.5 px-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted-theme)]">
                {locale === "vi" ? "Bài viết" : "Articles"}
              </div>
              <div className="flex flex-col gap-1">
                {results.posts.map((post) => {
                  const itemIndex = selectableItems.findIndex(
                    (it) => it.id === `post-${post.id}`,
                  );
                  const isSelected = itemIndex === selectedIndex;

                  const titleParts = highlightText(post.title, query);
                  const excerptParts = highlightText(post.excerpt, query);

                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() =>
                        handleSelectItem({
                          id: `post-${post.id}`,
                          type: "post",
                          title: post.title,
                          href: withLocale(`/${post.slug}`, locale),
                        })
                      }
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`group flex w-full flex-col rounded-xl p-3 text-left transition-colors ${
                        isSelected
                          ? "bg-[var(--primary-theme)]/10 border-l-2 border-[var(--primary-theme)]"
                          : "hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileText
                            className={`size-4 shrink-0 transition-colors ${
                              isSelected
                                ? "text-[var(--primary-theme)]"
                                : "text-[var(--text-soft-theme)]"
                            }`}
                          />
                          <h4 className="text-sm font-semibold text-[var(--text-main-theme)] line-clamp-1">
                            {titleParts.map((part, idx) =>
                              part.match ? (
                                <mark
                                  key={`t-${idx}`}
                                  className="rounded bg-[var(--primary-theme)]/20 px-0.5 text-[var(--primary-theme)] font-bold dark:bg-[var(--primary-theme)]/30"
                                >
                                  {part.text}
                                </mark>
                              ) : (
                                <span key={`t-${idx}`}>{part.text}</span>
                              ),
                            )}
                          </h4>
                        </div>

                        {post.category && (
                          <span className="shrink-0 rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted-theme)]">
                            {post.category.name}
                          </span>
                        )}
                      </div>

                      {post.excerpt && (
                        <p className="mt-1 pl-6 text-xs text-[var(--text-muted-theme)] line-clamp-1">
                          {excerptParts.map((part, idx) =>
                            part.match ? (
                              <mark
                                key={`e-${idx}`}
                                className="rounded bg-[var(--primary-theme)]/20 px-0.5 text-[var(--primary-theme)] font-medium"
                              >
                                {part.text}
                              </mark>
                            ) : (
                              <span key={`e-${idx}`}>{part.text}</span>
                            ),
                          )}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty Search Results */}
          {query.trim() && results.totalMatches === 0 && !isLoading && (
            <div className="py-10 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--text-soft-theme)]">
                <Search className="size-6" />
              </div>
              <p className="text-sm font-semibold text-[var(--text-main-theme)]">
                {locale === "vi"
                  ? `Không tìm thấy kết quả nào cho "${query}"`
                  : `No results found for "${query}"`}
              </p>
              <p className="mt-1 text-xs text-[var(--text-soft-theme)]">
                {locale === "vi"
                  ? "Hãy thử tìm bằng từ khóa ngắn hơn, tên công cụ hoặc thuật ngữ DevOps khác"
                  : "Try searching with broader terms or common DevOps keywords"}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border-soft-theme)] bg-[var(--surface-muted)] px-4 py-2.5 text-xs text-[var(--text-muted-theme)]">
          <div className="hidden sm:flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[var(--border-soft-theme)] bg-[var(--surface-elevated)] px-1 py-0.5 text-[10px]">
                ↑
              </kbd>
              <kbd className="rounded border border-[var(--border-soft-theme)] bg-[var(--surface-elevated)] px-1 py-0.5 text-[10px]">
                ↓
              </kbd>
              <span>{locale === "vi" ? "Di chuyển" : "Navigate"}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[var(--border-soft-theme)] bg-[var(--surface-elevated)] px-1.5 py-0.5 text-[10px]">
                ↵
              </kbd>
              <span>{locale === "vi" ? "Mở" : "Select"}</span>
            </span>
          </div>

          {query.trim() ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(
                  withLocale(
                    `/search?q=${encodeURIComponent(query.trim())}`,
                    locale,
                  ),
                );
              }}
              className="ml-auto inline-flex items-center gap-1.5 font-medium text-[var(--primary-theme)] hover:underline"
            >
              <span>
                {locale === "vi"
                  ? "Xem tất cả kết quả chi tiết"
                  : "View all detailed results"}
              </span>
              <ArrowRight className="size-3.5" />
            </button>
          ) : (
            <div className="ml-auto flex items-center gap-1 text-[11px] text-[var(--text-soft-theme)]">
              <span>DevOps Daily Smart Search</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
