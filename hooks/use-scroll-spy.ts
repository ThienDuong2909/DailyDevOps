"use client";

import { useEffect } from "react";
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
  const activationLine = headerHeight + 32;
  let activeHeading = headings[0];
  let closestHeadingTop = Number.NEGATIVE_INFINITY;

  for (const heading of headings) {
    const rect = heading.getBoundingClientRect();

    if (
      rect.height > 0 &&
      rect.top <= activationLine &&
      rect.top > closestHeadingTop
    ) {
      activeHeading = heading;
      closestHeadingTop = rect.top;
    }
  }

  return activeHeading.id;
}

function syncActiveHeading(
  headings: HTMLElement[],
  setActiveTocId: Dispatch<SetStateAction<string>>,
) {
  const activeId = resolveActiveHeadingId(headings);
  setActiveTocId((previous) =>
    previous === activeId ? previous : activeId,
  );
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

  let animationFrame = 0;
  const onScroll = () => {
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(() =>
      syncActiveHeading(headings, setActiveTocId),
    );
  };

  syncActiveHeading(headings, setActiveTocId);
  globalThis.window.addEventListener("scroll", onScroll, {
    passive: true,
    capture: true,
  });
  globalThis.document.addEventListener("scroll", onScroll, {
    passive: true,
    capture: true,
  });

  return () => {
    cancelAnimationFrame(animationFrame);
    globalThis.window.removeEventListener("scroll", onScroll, {
      capture: true,
    });
    globalThis.document.removeEventListener("scroll", onScroll, {
      capture: true,
    });
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
