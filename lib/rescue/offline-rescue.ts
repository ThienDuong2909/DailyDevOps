import type { PostStatus } from "@/types";

export interface ArticleRescueSnapshot {
  postId: string;
  locale: "vi" | "en";
  timestamp: number;
  title: string;
  subtitle: string;
  slug: string;
  content: string;
  contentJson: Record<string, unknown> | null;
  featuredImage: string;
  status: PostStatus;
  categoryId: string;
  tagIds: string[];
  scheduledAt: string;
}

const RESCUE_PREFIX = "devops_daily_rescue_post_";

export function getRescueKey(postId: string, locale: string = "vi"): string {
  return `${RESCUE_PREFIX}${postId}_${locale}`;
}

/**
 * Save an offline rescue snapshot to localStorage.
 * Runs instantly without debounce so changes are never lost if the browser crashes.
 */
export function saveRescueSnapshot(
  postId: string,
  snapshot: Omit<ArticleRescueSnapshot, "postId" | "timestamp">,
): void {
  if (typeof window === "undefined" || !postId) return;
  try {
    const key = getRescueKey(postId, snapshot.locale);
    const data: ArticleRescueSnapshot = {
      ...snapshot,
      postId,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    // Gracefully handle QuotaExceededError or private browsing
    console.warn("[OfflineRescue] Failed to save rescue snapshot:", error);
  }
}

/**
 * Retrieve the offline rescue snapshot for a given post and locale.
 */
export function getRescueSnapshot(
  postId: string,
  locale: string = "vi",
): ArticleRescueSnapshot | null {
  if (typeof window === "undefined" || !postId) return null;
  try {
    const key = getRescueKey(postId, locale);
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ArticleRescueSnapshot;
    if (!parsed || typeof parsed.timestamp !== "number") return null;
    return parsed;
  } catch (error) {
    console.warn("[OfflineRescue] Failed to read rescue snapshot:", error);
    return null;
  }
}

/**
 * Clear the offline rescue snapshot from localStorage once the post is cleanly saved or dismissed.
 */
export function clearRescueSnapshot(
  postId: string,
  locale: string = "vi",
): void {
  if (typeof window === "undefined" || !postId) return;
  try {
    const key = getRescueKey(postId, locale);
    window.localStorage.removeItem(key);
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Check if the rescue snapshot is genuinely newer than the server version.
 * Requires at least a 3-second difference to avoid false positives due to minor clock skew.
 */
export function isRescueNewerThanServer(
  rescue: ArticleRescueSnapshot | null,
  serverUpdatedAt?: string | null,
): boolean {
  if (!rescue || !rescue.timestamp) return false;
  // If rescue has empty content & empty title, it's not worth restoring
  if (!rescue.title?.trim() && !rescue.content?.trim()) return false;

  if (!serverUpdatedAt) return true;

  const serverTime = new Date(serverUpdatedAt).getTime();
  if (Number.isNaN(serverTime)) return true;

  return rescue.timestamp > serverTime + 3000;
}
