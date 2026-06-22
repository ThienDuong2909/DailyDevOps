"use client";

import { useEffect, useRef } from "react";
import type { TocItem } from "@/lib/content-transform";
import type { Dispatch, SetStateAction } from "react";

function bindHeadingAnchorClicks(
  headings: HTMLElement[],
  scrollToHeading: (
    headingId: string,
    options?: { updateHash?: boolean },
  ) => void,
) {
  headings.forEach((node) => {
    const anchor = node.querySelector<HTMLAnchorElement>(
      ".heading-anchor-link",
    );
    if (!anchor) {
      return;
    }

    anchor.onclick = (event) => {
      event.preventDefault();
      scrollToHeading(node.id);
    };
  });
}

function resolveActiveHeadingId(headings: HTMLElement[]) {
  const headerHeight =
    globalThis.document.querySelector("header")?.getBoundingClientRect()
      .height ?? 72;
  const activationLine = headerHeight + 96;

  let activeId = headings[0].id;

  for (const heading of headings) {
    // Viewport coordinates also work when the page is inside a scroll container.
    if (heading.getBoundingClientRect().top > activationLine) {
      break;
    }

    activeId = heading.id;
  }

  return activeId;
}

function syncHeadingState(
  headings: HTMLElement[],
  setActiveTocId: Dispatch<SetStateAction<string>>,
) {
  const activeId = resolveActiveHeadingId(headings);

  setActiveTocId((prev) => (prev === activeId ? prev : activeId));
}

function createScrollHandler(syncActiveHeading: () => void) {
  let rafId = 0;

  return {
    onScroll() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(syncActiveHeading);
    },
    clear() {
      cancelAnimationFrame(rafId);
    },
  };
}

function createScrollSpy(
  root: HTMLDivElement | null,
  scrollToHeading: (
    headingId: string,
    options?: { updateHash?: boolean },
  ) => void,
  setActiveTocId: Dispatch<SetStateAction<string>>,
) {
  if (!root) {
    return undefined;
  }

  const headings = Array.from(
    root.querySelectorAll<HTMLElement>("h2[id], h3[id]"),
  );
  if (!headings.length) {
    return undefined;
  }

  bindHeadingAnchorClicks(headings, scrollToHeading);

  const hash = globalThis.window.location.hash.replace("#", "");
  if (hash && headings.some((heading) => heading.id === hash)) {
    scrollToHeading(hash, { updateHash: false });
  } else {
    setActiveTocId(headings[0].id);
  }

  const syncActiveHeading = () => syncHeadingState(headings, setActiveTocId);
  const scrollHandler = createScrollHandler(syncActiveHeading);
  const pollInterval = setInterval(syncActiveHeading, 300);

  syncActiveHeading();

  globalThis.window.addEventListener("scroll", scrollHandler.onScroll, {
    passive: true,
    capture: true,
  });
  globalThis.document.addEventListener("scroll", scrollHandler.onScroll, {
    passive: true,
    capture: true,
  });
  globalThis.window.addEventListener("resize", syncActiveHeading, {
    passive: true,
  });

  return () => {
    scrollHandler.clear();
    clearInterval(pollInterval);
    globalThis.window.removeEventListener("scroll", scrollHandler.onScroll, {
      capture: true,
    });
    globalThis.document.removeEventListener("scroll", scrollHandler.onScroll, {
      capture: true,
    });
    globalThis.window.removeEventListener("resize", syncActiveHeading);
  };
}

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
  setActiveTocId: Dispatch<SetStateAction<string>>;
  scrollToHeading: (
    headingId: string,
    options?: { updateHash?: boolean },
  ) => void;
}) {
  const rafRef = useRef(0);

  useEffect(() => {
    if (!contentRef.current || !derivedTocItems.length) return;

    let disposeScrollSpy: (() => void) | undefined;
    let setupTimer: ReturnType<typeof setTimeout>;
    let isCleanedUp = false;

    setupTimer = setTimeout(() => {
      if (isCleanedUp) {
        return;
      }

      disposeScrollSpy = createScrollSpy(
        contentRef.current,
        scrollToHeading,
        setActiveTocId,
      );
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
