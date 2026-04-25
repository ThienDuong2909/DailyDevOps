"use client";

import { useEffect, useRef } from "react";
import type { TocItem } from "@/lib/content-transform";

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
  const threshold = headerHeight + 20;

  let activeId = headings[0].id;

  for (const heading of headings) {
    if (heading.getBoundingClientRect().top > threshold) {
      break;
    }

    activeId = heading.id;
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
    return lastHeadingId;
  }

  return activeId;
}

function syncHeadingState(
  headings: HTMLElement[],
  setActiveTocId: React.Dispatch<React.SetStateAction<string>>,
) {
  const activeId = resolveActiveHeadingId(headings);

  setActiveTocId((prev) => (prev === activeId ? prev : activeId));

  const nextHash = `#${activeId}`;
  if (globalThis.window.location.hash === nextHash) {
    return;
  }

  globalThis.window.history.replaceState(
    globalThis.window.history.state ?? {},
    "",
    `${globalThis.window.location.pathname}${nextHash}`,
  );
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
  setActiveTocId: React.Dispatch<React.SetStateAction<string>>,
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
  const pollInterval = setInterval(syncActiveHeading, 150);

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
  setActiveTocId: React.Dispatch<React.SetStateAction<string>>;
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
