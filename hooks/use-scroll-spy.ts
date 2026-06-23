"use client";

import { useEffect, useRef } from "react";
import type { TocItem } from "@/lib/content-transform";
import type { Dispatch, SetStateAction } from "react";

/**
 * Returns the height of the sticky header element, or a sensible default.
 */
function getHeaderHeight(): number {
  return (
    globalThis.document?.querySelector("header")?.getBoundingClientRect()
      .height ?? 72
  );
}

/**
 * Determines which heading is currently "active" based on scroll position.
 *
 * Strategy: pick the last heading whose top edge has scrolled past the
 * activation line (header height + a small buffer). If none have scrolled
 * past, default to the first heading.
 */
function resolveActiveHeadingId(headings: HTMLElement[]): string {
  if (!headings.length) return "";

  const activationLine = getHeaderHeight() + 40;
  let activeHeading = headings[0];

  for (const heading of headings) {
    const rect = heading.getBoundingClientRect();
    // Only consider headings that are visible (have layout)
    if (rect.height === 0) continue;

    if (rect.top <= activationLine) {
      activeHeading = heading;
    } else {
      // Headings are in DOM order, so once we find one below the
      // activation line, all subsequent ones are also below it.
      break;
    }
  }

  return activeHeading.id;
}

/**
 * Scroll-spy hook: tracks which heading is currently in view
 * and syncs the URL hash and TOC active state accordingly.
 *
 * Also handles:
 * - Suppressing scroll-spy updates while a programmatic smooth-scroll
 *   is in progress (to avoid "fighting" between click-to-scroll and
 *   the spy).
 * - Binding heading anchor link clicks to scroll-to-heading.
 * - Restoring hash-based heading on initial load and on hashchange.
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
  // Tracks whether we should suppress scroll-spy updates.
  // This is set to `true` when a programmatic smooth-scroll begins
  // (e.g., user clicks a TOC item) and cleared after scrolling settles.
  const isScrollingProgrammatically = useRef(false);
  const programmaticScrollTimer = useRef<ReturnType<typeof setTimeout>>(
    undefined as unknown as ReturnType<typeof setTimeout>,
  );

  useEffect(() => {
    const root = contentRef.current;
    if (!root || !derivedTocItems.length) return;

    // Collect heading elements from the content area
    const headings = Array.from(
      root.querySelectorAll<HTMLElement>("h2[id], h3[id]"),
    );
    if (!headings.length) return;

    // --- Bind heading anchor clicks ---
    const anchorClickHandlers: Array<{
      anchor: HTMLAnchorElement;
      handler: (e: MouseEvent) => void;
    }> = [];

    headings.forEach((node) => {
      const anchor = node.querySelector<HTMLAnchorElement>(
        ".heading-anchor-link",
      );
      if (!anchor) return;

      const handler = (event: MouseEvent) => {
        event.preventDefault();
        suppressScrollSpy();
        scrollToHeading(node.id);
      };

      anchor.addEventListener("click", handler);
      anchorClickHandlers.push({ anchor, handler });
    });

    // --- Suppress scroll-spy during programmatic scrolls ---
    function suppressScrollSpy() {
      isScrollingProgrammatically.current = true;
      clearTimeout(programmaticScrollTimer.current);
      // Re-enable after smooth-scroll has had time to settle.
      // 800ms is generous enough for most smooth-scroll durations.
      programmaticScrollTimer.current = setTimeout(() => {
        isScrollingProgrammatically.current = false;
        // Sync once after scroll finishes
        syncActiveHeading();
      }, 800);
    }

    // --- Scroll spy handler ---
    let rafId = 0;

    function syncActiveHeading() {
      const activeId = resolveActiveHeadingId(headings);
      setActiveTocId((prev) => (prev === activeId ? prev : activeId));
    }

    function onScroll() {
      if (isScrollingProgrammatically.current) return;

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(syncActiveHeading);
    }

    // --- Initial state ---
    const hash = globalThis.window.location.hash.replace("#", "");
    if (hash && headings.some((h) => h.id === hash)) {
      suppressScrollSpy();
      scrollToHeading(hash, { updateHash: false });
    } else {
      // Sync active heading based on current scroll position
      syncActiveHeading();
    }

    // --- Attach scroll listener ---
    // Using window scroll since the page scrolls at the document level.
    globalThis.window.addEventListener("scroll", onScroll, { passive: true });

    // --- Intercept TOC button clicks to suppress scroll spy ---
    // Listen to clicks on the sidebar TOC buttons. When a TOC button is
    // clicked, `scrollToHeading` is called by the PostSidebar component,
    // which triggers a smooth scroll. We need to suppress the scroll spy
    // during this time.
    function onTocClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const button = target.closest<HTMLElement>("button[data-toc-id]");
      if (button) {
        suppressScrollSpy();
      }
    }

    globalThis.document.addEventListener("click", onTocClick, {
      capture: true,
    });

    // --- Hashchange handler ---
    function onHashChange() {
      const currentHash = globalThis.window.location.hash.replace("#", "");
      if (currentHash) {
        suppressScrollSpy();
        scrollToHeading(currentHash, { updateHash: false });
      }
    }

    globalThis.window.addEventListener("hashchange", onHashChange);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(programmaticScrollTimer.current);
      globalThis.window.removeEventListener("scroll", onScroll);
      globalThis.document.removeEventListener("click", onTocClick, {
        capture: true,
      });
      globalThis.window.removeEventListener("hashchange", onHashChange);

      anchorClickHandlers.forEach(({ anchor, handler }) => {
        anchor.removeEventListener("click", handler);
      });
    };
  }, [derivedTocItems, scrollToHeading, contentRef, setActiveTocId]);
}
