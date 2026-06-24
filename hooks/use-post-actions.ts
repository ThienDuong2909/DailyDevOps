"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

/**
 * Tracks page reading progress (scroll percentage).
 * Uses requestAnimationFrame throttling to avoid triggering
 * excessive re-renders during fast scrolling.
 */
export function useReadingProgress() {
  const [progress, setProgress] = useState(0);
  const rafId = useRef(0);

  useEffect(() => {
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(Math.min(100, max > 0 ? (window.scrollY / max) * 100 : 0));
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(updateProgress);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return progress;
}

/**
 * Provides handlers for content interactions:
 * - Copy code buttons inside code blocks
 * - Share post via native share or clipboard
 */
export function usePostActions(
  postUrl: string,
  postTitle?: string,
  postExcerpt?: string,
) {
  const handleContentClick = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const button = target.closest(".copy-code-btn");
      if (!button) return;
      const code = button.closest(".macos-mockup")?.querySelector("code");
      if (!code) return;
      navigator.clipboard.writeText(code.textContent || "").then(() => {
        const html = button.innerHTML;
        button.innerHTML = "Copied!";
        setTimeout(() => {
          button.innerHTML = html;
        }, 1600);
      });
    },
    [],
  );

  const handleShare = async (mode: "native" | "copy") => {
    if (!postTitle) return;
    if (mode === "native" && navigator.share) {
      try {
        await navigator.share({
          title: postTitle,
          text: postExcerpt || postTitle,
          url: postUrl,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(postUrl);
      toast.success("Da copy link bai viet");
    } catch {
      toast.error("Khong the copy link bai viet");
    }
  };

  return { handleContentClick, handleShare };
}
