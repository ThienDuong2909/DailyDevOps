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

  const headingsInReadingLine = new Set<HTMLElement>();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const heading = entry.target as HTMLElement;

      if (entry.isIntersecting) {
        headingsInReadingLine.add(heading);
      } else {
        headingsInReadingLine.delete(heading);
      }
    });

    const activeHeading = headings
      .filter((heading) => headingsInReadingLine.has(heading))
      .sort(
        (first, second) =>
          first.getBoundingClientRect().top -
          second.getBoundingClientRect().top,
      )[0];

    if (activeHeading) {
      setActiveTocId((previous) =>
        previous === activeHeading.id ? previous : activeHeading.id,
      );
    }
  }, {
    // A narrow reading line below the sticky header prevents distant headings
    // from competing with the section currently being read.
    root: null,
    rootMargin: "-15% 0px -75% 0px",
    threshold: 0,
  });
  headings.forEach((heading) => observer.observe(heading));

  return () => {
    observer.disconnect();
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
