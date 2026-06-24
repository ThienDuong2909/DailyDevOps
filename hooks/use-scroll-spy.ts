"use client";

import { useEffect, useRef, useCallback } from "react";
import type { TocItem } from "@/lib/content-transform";
import type { Dispatch, SetStateAction } from "react";

/**
 * Scroll-spy hook: tracks which heading is currently in view
 * and syncs the TOC active state accordingly.
 *
 * Key design decisions:
 * - Headings are queried fresh from the DOM on every sync (not cached)
 *   because React may replace the innerHTML when re-rendering
 *   dangerouslySetInnerHTML, which detaches cached element references.
 * - Uses refs for callbacks to avoid stale closures and effect re-runs.
 * - Throttled via requestAnimationFrame (max once per frame).
 */
export function useScrollSpy({
  contentRef,
  derivedTocItems,
  setActiveTocId,
  scrollToHeading,
}: {
  contentRef: React.RefObject<HTMLDivElement | null>;
  derivedTocItems: TocItem[];
  setActiveTocId: Dispatch<SetStateAction<string>>;
  scrollToHeading: (
    headingId: string,
    options?: { updateHash?: boolean },
  ) => void;
}) {
  // Store callbacks in refs to keep closures fresh without re-running effects
  const setActiveTocIdRef = useRef(setActiveTocId);
  setActiveTocIdRef.current = setActiveTocId;

  const scrollToHeadingRef = useRef(scrollToHeading);
  scrollToHeadingRef.current = scrollToHeading;

  const contentRefRef = useRef(contentRef);
  contentRefRef.current = contentRef;

  // Suppression flag for programmatic smooth-scrolls
  const isProgrammaticScroll = useRef(false);
  const suppressionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suppressScrollSpy = useCallback(() => {
    isProgrammaticScroll.current = true;
    if (suppressionTimer.current) {
      clearTimeout(suppressionTimer.current);
    }
    suppressionTimer.current = setTimeout(() => {
      isProgrammaticScroll.current = false;
      suppressionTimer.current = null;
    }, 1200);
  }, []);

  useEffect(() => {
    // Wait until we have TOC items (means content has been parsed)
    if (!derivedTocItems.length) return;

    /**
     * Query heading elements FRESH from the DOM every time.
     * This is critical because React can replace the entire innerHTML
     * of the article-copy div on re-renders, which detaches any
     * previously cached element references.
     */
    function getHeadings(): HTMLElement[] {
      const root = contentRefRef.current?.current;
      if (!root) return [];
      return Array.from(root.querySelectorAll<HTMLElement>("h2[id], h3[id]"));
    }

    /**
     * Determine which heading is currently "active" based on scroll position.
     * Strategy: pick the last heading whose top edge has scrolled past
     * the activation line (header height + buffer).
     */
    function computeActiveId(): string {
      const headings = getHeadings();
      if (!headings.length) return "";

      const headerEl = document.querySelector("header");
      const headerHeight = headerEl?.getBoundingClientRect().height ?? 72;
      const activationLine = headerHeight + 40;

      let activeId = headings[0].id;

      for (const heading of headings) {
        const rect = heading.getBoundingClientRect();
        if (rect.height === 0) continue;

        if (rect.top <= activationLine) {
          activeId = heading.id;
        } else {
          break;
        }
      }

      return activeId;
    }

    function syncActiveTocItem() {
      if (isProgrammaticScroll.current) return;
      const id = computeActiveId();
      if (id) {
        setActiveTocIdRef.current((prev) => (prev === id ? prev : id));
      }
    }

    // --- Scroll listener (throttled with rAF) ---
    let rafId = 0;

    function onScroll() {
      if (isProgrammaticScroll.current) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(syncActiveTocItem);
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    // --- TOC sidebar button clicks → suppress scroll spy ---
    function onTocButtonClick(event: Event) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("button[data-toc-id]")) {
        suppressScrollSpy();
      }
    }

    document.addEventListener("click", onTocButtonClick, { capture: true });

    // --- Heading anchor link clicks ---
    function onAnchorClick(event: Event) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest(
        ".heading-anchor-link",
      ) as HTMLAnchorElement | null;
      if (!anchor) return;

      const heading = anchor.closest("h2[id], h3[id]") as HTMLElement | null;
      if (!heading) return;

      event.preventDefault();
      suppressScrollSpy();
      scrollToHeadingRef.current(heading.id);
    }

    // Attach to document so it works even if content DOM is replaced
    document.addEventListener("click", onAnchorClick);

    // --- Hash change handler ---
    function onHashChange() {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const headings = getHeadings();
        if (headings.some((h) => h.id === hash)) {
          suppressScrollSpy();
          scrollToHeadingRef.current(hash, { updateHash: false });
        }
      }
    }

    window.addEventListener("hashchange", onHashChange);

    // --- Initial sync ---
    const initialHash = window.location.hash.slice(1);
    if (initialHash) {
      // Delay to let layout settle
      requestAnimationFrame(() => {
        const headings = getHeadings();
        if (headings.some((h) => h.id === initialHash)) {
          suppressScrollSpy();
          scrollToHeadingRef.current(initialHash, { updateHash: false });
        }
      });
    } else {
      requestAnimationFrame(syncActiveTocItem);
    }

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(rafId);
      if (suppressionTimer.current) {
        clearTimeout(suppressionTimer.current);
      }
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onTocButtonClick, {
        capture: true,
      });
      document.removeEventListener("click", onAnchorClick);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [derivedTocItems, suppressScrollSpy]);
}
