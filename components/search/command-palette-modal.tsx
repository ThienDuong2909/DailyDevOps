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
  const modalRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Smooth macOS-style motion lifecycle
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GroupedSearchResults>({
    posts: [],
    categories: [],
    tags: [],
    totalMatches: 0,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Close handler with smooth exit motion
  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsMounted(false);
      setQuery("");
      setSelectedIndex(0);
      onClose();
    }, 220);
  }, [onClose]);

  // Motion lifecycle: trigger animation when isOpen changes
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const frame1 = requestAnimationFrame(() => {
        const frame2 = requestAnimationFrame(() => {
          setIsAnimating(true);
        });
        return () => cancelAnimationFrame(frame2);
      });
      return () => cancelAnimationFrame(frame1);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
        setQuery("");
        setSelectedIndex(0);
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Click outside detection: Closes modal if clicking outside without blocking page scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, handleClose]);

  // Global ESC key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, handleClose]);

  // Initialize and preload the search index
  useEffect(() => {
    if (!isOpen) return;

    let isMountedLocal = true;
    const engine = getSearchEngine();

    if (!engine.isReady() || engine.getLocale() !== locale) {
      setIsLoading(true);
      loadSearchIndex(locale)
        .then(() => {
          if (isMountedLocal) {
            setIsLoading(false);
            if (query.trim()) {
              setResults(engine.search(query, { limit: 8 }));
            }
          }
        })
        .catch(() => {
          if (isMountedLocal) setIsLoading(false);
        });
    }

    return () => {
      isMountedLocal = false;
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
      handleClose();
      startTransition(() => {
        router.push(item.href);
      });
    },
    [handleClose, router],
  );

  // Keyboard navigation inside modal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
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
    [selectableItems, selectedIndex, handleSelectItem, handleClose],
  );

  // Trending / Suggestion quick-search keywords
  const popularKeywords = [
    "Docker",
    "Kubernetes",
    "CI/CD",
    "Terraform",
    "Prometheus",
    "Linux",
  ];

  if (!isMounted) return null;

  return (
    <>
      {/* Soft dimmed & gently blurred backdrop (layer xám blur nhẹ) */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/20 dark:bg-black/45 backdrop-blur-[2px] transition-opacity duration-200 ${
          isAnimating
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        className="fixed inset-x-0 top-0 z-50 pointer-events-none flex justify-center px-3 pt-14 sm:px-6 sm:pt-20"
        role="dialog"
        aria-modal="true"
      >
        {/* 
          Modal Box with 100% Solid Background (Opacity 1.0) & macOS Spring Morph Motion:
          - Originates from header position (-translate-y-6 scale-95 opacity-0 blur-sm)
          - Morphs smoothly into center window (translate-y-0 scale-100 opacity-100 blur-0)
          - Background is 100% solid, fully opaque (Opacity 1.0)
        */}
        <div
          ref={modalRef}
          className={`pointer-events-auto relative z-50 flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-cyan-500/20 dark:border-cyan-400/25 bg-[var(--surface-elevated)] shadow-[0_24px_70px_-10px_rgba(15,23,42,0.22),0_0_0_1px_rgba(6,182,212,0.08),0_0_40px_rgba(6,182,212,0.12)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isAnimating
              ? "translate-y-0 scale-100 opacity-100 blur-0"
              : "-translate-y-6 scale-95 opacity-0 blur-sm pointer-events-none"
          }`}
          onKeyDown={handleKeyDown}
        >
          {/* Search Input Bar */}
          <div className="relative flex items-center border-b border-cyan-500/15 dark:border-cyan-500/20 px-4 py-3.5 sm:px-5">
            <Search className="size-5 shrink-0 text-cyan-500" />
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
              <Loader2 className="size-4 animate-spin text-cyan-500 mr-2" />
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

            <kbd
              onClick={handleClose}
              className="hidden sm:inline-flex cursor-pointer items-center rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 transition-colors hover:bg-cyan-500/20"
              title="Đóng tìm kiếm (Escape)"
            >
              ESC
            </kbd>
          </div>

          {/* Scrollable Results Area */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-2 sm:p-3 scrollbar-thin scrollbar-thumb-[var(--border-soft-theme)]"
          >
            {/* Default State: Popular Keywords */}
            {!query.trim() && (
              <div className="p-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted-theme)]">
                  <Sparkles className="size-3.5 text-cyan-500" />
                  <span>
                    {locale === "vi" ? "Chủ đề phổ biến" : "Popular Topics"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {popularKeywords.map((keyword) => (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => {
                        setQuery(keyword);
                        inputRef.current?.focus();
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-cyan-500/15 bg-cyan-500/5 px-3 py-1.5 text-xs font-medium text-[var(--text-main-theme)] transition-all hover:border-cyan-500/40 hover:bg-cyan-500/15 hover:text-cyan-600 dark:hover:text-cyan-400"
                    >
                      <span className="text-cyan-500">#</span>
                      <span>{keyword}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 text-center text-xs text-[var(--text-soft-theme)]">
                  {locale === "vi"
                    ? "Gõ từ khóa bất kỳ để tìm kiếm tức thì với độ trễ 0ms"
                    : "Type any term to search technical posts with 0ms latency"}
                </div>
              </div>
            )}

            {/* Group 1: Categories */}
            {results.categories.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted-theme)]">
                  <Folder className="size-3 text-cyan-500" />
                  <span>{locale === "vi" ? "Chuyên mục" : "Categories"}</span>
                </div>
                <div className="mt-1 flex flex-col gap-1">
                  {results.categories.map((category) => {
                    const itemIndex = selectableItems.findIndex(
                      (i) => i.id === `cat-${category.slug}`,
                    );
                    const isSelected = itemIndex === selectedIndex;
                    const nameParts = highlightText(category.name, query);

                    return (
                      <button
                        key={category.slug}
                        type="button"
                        onClick={() =>
                          handleSelectItem({
                            id: `cat-${category.slug}`,
                            type: "category",
                            title: category.name,
                            href: withLocale(
                              `/category/${category.slug}`,
                              locale,
                            ),
                          })
                        }
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-all ${
                          isSelected
                            ? "bg-gradient-to-r from-primary/10 via-cyan-500/10 to-transparent border-l-2 border-primary text-primary font-medium"
                            : "text-[var(--text-main-theme)] hover:bg-cyan-500/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Folder className="size-4 shrink-0 text-cyan-500" />
                          <span className="truncate">
                            {nameParts.map((part, idx) =>
                              part.match ? (
                                <mark
                                  key={idx}
                                  className="rounded bg-cyan-500/20 px-0.5 text-cyan-600 dark:text-cyan-400 font-semibold"
                                >
                                  {part.text}
                                </mark>
                              ) : (
                                <span key={idx}>{part.text}</span>
                              ),
                            )}
                          </span>
                        </div>
                        <span className="text-xs text-[var(--text-soft-theme)] shrink-0">
                          {locale === "vi" ? "Xem chuyên mục" : "View category"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Group 2: Tags */}
            {results.tags.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted-theme)]">
                  <Hash className="size-3 text-cyan-500" />
                  <span>{locale === "vi" ? "Thẻ bài viết" : "Tags"}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5 px-2">
                  {results.tags.map((tag) => {
                    const itemIndex = selectableItems.findIndex(
                      (i) => i.id === `tag-${tag.slug}`,
                    );
                    const isSelected = itemIndex === selectedIndex;
                    const nameParts = highlightText(tag.name, query);

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
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-500 text-white font-semibold shadow-xs"
                            : "border-cyan-500/15 bg-cyan-500/5 text-[var(--text-main-theme)] hover:border-cyan-500/40 hover:bg-cyan-500/10"
                        }`}
                      >
                        <span>#</span>
                        <span>
                          {nameParts.map((part, idx) =>
                            part.match ? (
                              <mark
                                key={idx}
                                className="rounded bg-cyan-500/25 px-0.5 text-cyan-700 dark:text-cyan-300 font-bold"
                              >
                                {part.text}
                              </mark>
                            ) : (
                              <span key={idx}>{part.text}</span>
                            ),
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Group 3: Posts */}
            {results.posts.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted-theme)]">
                  <FileText className="size-3 text-cyan-500" />
                  <span>
                    {locale === "vi" ? "Bài viết liên quan" : "Articles"}
                  </span>
                </div>
                <div className="mt-1 flex flex-col gap-1">
                  {results.posts.map((post) => {
                    const itemIndex = selectableItems.findIndex(
                      (i) => i.id === `post-${post.id}`,
                    );
                    const isSelected = itemIndex === selectedIndex;
                    const titleParts = highlightText(post.title, query);
                    const excerptParts = highlightText(
                      post.excerpt || "",
                      query,
                    );

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
                        className={`flex w-full flex-col rounded-xl px-3 py-2.5 text-left transition-all ${
                          isSelected
                            ? "bg-gradient-to-r from-primary/10 via-cyan-500/10 to-transparent border-l-2 border-primary"
                            : "hover:bg-cyan-500/5"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="size-4 shrink-0 text-cyan-500" />
                            <span className="truncate text-sm font-semibold text-[var(--text-main-theme)]">
                              {titleParts.map((part, idx) =>
                                part.match ? (
                                  <mark
                                    key={`t-${idx}`}
                                    className="rounded bg-cyan-500/20 px-0.5 text-cyan-600 dark:text-cyan-400 font-bold"
                                  >
                                    {part.text}
                                  </mark>
                                ) : (
                                  <span key={`t-${idx}`}>{part.text}</span>
                                ),
                              )}
                            </span>
                          </div>

                          {post.category && (
                            <span className="shrink-0 rounded-md bg-cyan-500/10 border border-cyan-500/15 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700 dark:text-cyan-300">
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
                                  className="rounded bg-cyan-500/20 px-0.5 text-cyan-600 dark:text-cyan-400 font-medium"
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
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
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
          <div className="flex items-center justify-between border-t border-cyan-500/15 dark:border-cyan-500/20 bg-[var(--surface-muted)] px-4 py-2.5 text-xs text-[var(--text-muted-theme)]">
            <div className="hidden sm:flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-cyan-500/20 bg-[var(--surface-elevated)] px-1 py-0.5 text-[10px]">
                  ↑
                </kbd>
                <kbd className="rounded border border-cyan-500/20 bg-[var(--surface-elevated)] px-1 py-0.5 text-[10px]">
                  ↓
                </kbd>
                <span>{locale === "vi" ? "Di chuyển" : "Navigate"}</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-cyan-500/20 bg-[var(--surface-elevated)] px-1.5 py-0.5 text-[10px]">
                  ↵
                </kbd>
                <span>{locale === "vi" ? "Mở" : "Select"}</span>
              </span>
            </div>

            {query.trim() ? (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  router.push(
                    withLocale(
                      `/search?q=${encodeURIComponent(query.trim())}`,
                      locale,
                    ),
                  );
                }}
                className="ml-auto inline-flex items-center gap-1.5 font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
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
    </>
  );
}
