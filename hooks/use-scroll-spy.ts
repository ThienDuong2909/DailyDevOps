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
        const anchor = node.querySelector(
          ".heading-anchor-link",
        ) as HTMLAnchorElement | null;
        if (anchor) {
          anchor.onclick = (e) => {
            e.preventDefault();
            scrollToHeading(node.id);
          };
        }
      });

      // Restore URL hash position on first load
      const hash = window.location.hash.replace("#", "");
      if (hash && headings.find((h) => h.id === hash)) {
        scrollToHeading(hash, { updateHash: false });
      } else {
        setActiveTocId(headings[0].id);
      }

      const syncActiveHeading = () => {
        const headerHeight =
          document.querySelector("header")?.getBoundingClientRect().height ??
          72;
        const threshold = headerHeight + 20;

        let activeId = headings[0].id;
        for (const h of headings) {
          if (h.getBoundingClientRect().top <= threshold) {
            activeId = h.id;
          } else {
            break;
          }
        }

        const scrollTop =
          document.scrollingElement?.scrollTop ??
          document.documentElement.scrollTop ??
          document.body.scrollTop ??
          window.scrollY;
        const scrollHeight =
          document.scrollingElement?.scrollHeight ??
          document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;

        if (Math.ceil(scrollTop + clientHeight) >= scrollHeight - 4) {
          activeId = headings[headings.length - 1].id;
        }

        setActiveTocId((prev) => (prev === activeId ? prev : activeId));

        const nextHash = `#${activeId}`;
        if (window.location.hash !== nextHash) {
          window.history.replaceState(
            window.history.state ?? {},
            "",
            `${window.location.pathname}${nextHash}`,
          );
        }
      };

      syncActiveHeading();

      const onScroll = () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(syncActiveHeading);
      };

      window.addEventListener("scroll", onScroll, {
        passive: true,
        capture: true,
      });
      document.addEventListener("scroll", onScroll, {
        passive: true,
        capture: true,
      });
      window.addEventListener("resize", syncActiveHeading, { passive: true });

      const pollInterval = setInterval(syncActiveHeading, 150);

      const dispose = () => {
        cancelAnimationFrame(rafId);
        clearInterval(pollInterval);
        window.removeEventListener("scroll", onScroll, { capture: true });
        document.removeEventListener("scroll", onScroll, { capture: true });
        window.removeEventListener("resize", syncActiveHeading);
      };

      (setupScrollSpy as unknown as { dispose?: () => void }).dispose = dispose;
    };

    setupTimer = setTimeout(() => {
      setupScrollSpy();
    }, 300);

    return () => {
      isCleanedUp = true;
      clearTimeout(setupTimer);
      cancelAnimationFrame(rafRef.current);
      const dispose = (setupScrollSpy as unknown as { dispose?: () => void })
        .dispose;
      dispose?.();
    };
  }, [derivedTocItems, scrollToHeading, contentRef, setActiveTocId]);

  useEffect(() => {
    const onHashChange = () => {
      const currentHash = window.location.hash.replace("#", "");
      if (currentHash) {
        scrollToHeading(currentHash, { updateHash: false });
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [scrollToHeading]);
}
