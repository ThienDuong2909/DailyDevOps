"use client";

import { useEffect, useRef } from "react";
import type { TocItem } from "@/lib/content-transform";

/**
 * Scroll-spy hook: tracks which heading is currently in view
 * and syncs the URL hash and TOC active state accordingly.
 */
export function useScrollSpy({
  contentRef,
  derivedTocItems,
  setActiveTocId,
  scrollToHeading,
}: {
  contentRef: React.RefObject<HTMLDivElement | null>;
  derivedTocItems: TocItem[];
  setActiveTocId: React.Dispatch<React.SetStateAction<string>>;
  scrollToHeading: (
    headingId: string,
    options?: { updateHash?: boolean },
  ) => void;
}) {
  const rafRef = useRef(0);

  useEffect(() => {
    if (!contentRef.current || !derivedTocItems.length) return;

    let rafId = 0;
    let disposeScrollSpy: (() => void) | undefined;
    let setupTimer: ReturnType<typeof setTimeout>;
    let isCleanedUp = false;

    const setupScrollSpy = () => {
      const root = contentRef.current;
      if (!root || isCleanedUp) return;

      const headings = Array.from(
        root.querySelectorAll<HTMLElement>("h2[id], h3[id]"),
      );
      if (!headings.length) return;

      // Attach anchor click handlers
      headings.forEach((node) => {
        const anchor = node.querySelector<HTMLAnchorElement>(
          ".heading-anchor-link",
        );
        if (anchor) {
          anchor.onclick = (e) => {
            e.preventDefault();
            scrollToHeading(node.id);
          };
        }
      });

      // Restore URL hash position on first load
      const hash = globalThis.window.location.hash.replace("#", "");
      if (hash && headings.some((heading) => heading.id === hash)) {
        scrollToHeading(hash, { updateHash: false });
      } else {
        setActiveTocId(headings[0].id);
      }

      const syncActiveHeading = () => {
        const headerHeight =
          globalThis.document.querySelector("header")?.getBoundingClientRect()
            .height ?? 72;
        const threshold = headerHeight + 20;

        let activeId = headings[0].id;
        for (const heading of headings) {
          if (heading.getBoundingClientRect().top <= threshold) {
            activeId = heading.id;
          } else {
            break;
          }
        }

        const scrollTop =
          globalThis.document.scrollingElement?.scrollTop ??
          globalThis.document.documentElement.scrollTop ??
          globalThis.document.body.scrollTop ??
          globalThis.window.scrollY;
        const scrollHeight =
          globalThis.document.scrollingElement?.scrollHeight ??
          globalThis.document.documentElement.scrollHeight;
        const clientHeight = globalThis.window.innerHeight;
        const lastHeadingId = headings.at(-1)?.id ?? headings[0].id;

        if (Math.ceil(scrollTop + clientHeight) >= scrollHeight - 4) {
          activeId = lastHeadingId;
        }

        setActiveTocId((prev) => (prev === activeId ? prev : activeId));

        const nextHash = `#${activeId}`;
        if (globalThis.window.location.hash !== nextHash) {
          globalThis.window.history.replaceState(
            globalThis.window.history.state ?? {},
            "",
            `${globalThis.window.location.pathname}${nextHash}`,
          );
        }
      };

      syncActiveHeading();

      const onScroll = () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(syncActiveHeading);
      };

      globalThis.window.addEventListener("scroll", onScroll, {
        passive: true,
        capture: true,
      });
      globalThis.document.addEventListener("scroll", onScroll, {
        passive: true,
        capture: true,
      });
      globalThis.window.addEventListener("resize", syncActiveHeading, {
        passive: true,
      });

      const pollInterval = setInterval(syncActiveHeading, 150);

      disposeScrollSpy = () => {
        cancelAnimationFrame(rafId);
        clearInterval(pollInterval);
        globalThis.window.removeEventListener("scroll", onScroll, {
          capture: true,
        });
        globalThis.document.removeEventListener("scroll", onScroll, {
          capture: true,
        });
        globalThis.window.removeEventListener("resize", syncActiveHeading);
      };
    };

    setupTimer = setTimeout(() => {
      setupScrollSpy();
    }, 300);

    return () => {
      isCleanedUp = true;
      clearTimeout(setupTimer);
      cancelAnimationFrame(rafRef.current);
      disposeScrollSpy?.();
    };
  }, [derivedTocItems, scrollToHeading, contentRef, setActiveTocId]);

  useEffect(() => {
    const onHashChange = () => {
      const currentHash = globalThis.window.location.hash.replace("#", "");
      if (currentHash) {
        scrollToHeading(currentHash, { updateHash: false });
      }
    };

    globalThis.window.addEventListener("hashchange", onHashChange);
    return () =>
      globalThis.window.removeEventListener("hashchange", onHashChange);
  }, [scrollToHeading]);
}
