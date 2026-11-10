/**
 * Lightweight LCS (Longest Common Subsequence) Diff Engine
 * Optimized for comparing article revisions and markdown/HTML text.
 */

export type DiffChangeType = "added" | "removed" | "unchanged";

export interface DiffPart {
  type: DiffChangeType;
  value: string;
}

export interface DiffLine {
  type: DiffChangeType;
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

export interface SideBySideRow {
  left?: {
    lineNumber?: number;
    content: string;
    type: "removed" | "unchanged";
  };
  right?: {
    lineNumber?: number;
    content: string;
    type: "added" | "unchanged";
  };
}

/**
 * Strips HTML tags and preserves readable paragraph / line spacing.
 */
export function stripHtmlToReadableText(html: string): string {
  if (!html) return "";

  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Compute Longest Common Subsequence between two string arrays.
 */
export function computeLcsDiff(
  oldItems: string[],
  newItems: string[],
): DiffPart[] {
  const m = oldItems.length;
  const n = newItems.length;

  if (m === 0 && n === 0) return [];
  if (m === 0) {
    return newItems.map((val) => ({ type: "added" as const, value: val }));
  }
  if (n === 0) {
    return oldItems.map((val) => ({ type: "removed" as const, value: val }));
  }

  // To prevent memory overflow for unusually gigantic inputs (> 1500 lines),
  // we cap matrix allocation or fall back to linear compare.
  if (m * n > 2_500_000) {
    // Large file fallback: line-by-line simple pairing
    const parts: DiffPart[] = [];
    const minLen = Math.min(m, n);
    for (let idx = 0; idx < minLen; idx++) {
      if (oldItems[idx] === newItems[idx]) {
        parts.push({ type: "unchanged", value: oldItems[idx] });
      } else {
        parts.push({ type: "removed", value: oldItems[idx] });
        parts.push({ type: "added", value: newItems[idx] });
      }
    }
    for (let idx = minLen; idx < m; idx++) {
      parts.push({ type: "removed", value: oldItems[idx] });
    }
    for (let idx = minLen; idx < n; idx++) {
      parts.push({ type: "added", value: newItems[idx] });
    }
    return parts;
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (oldItems[i] === newItems[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffPart[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldItems[i - 1] === newItems[j - 1]) {
      result.unshift({ type: "unchanged", value: oldItems[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "added", value: newItems[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ type: "removed", value: oldItems[i - 1] });
      i--;
    }
  }

  return result;
}

/**
 * Computes unified line-by-line diff with line numbers and stats.
 */
export function computeLineDiff(
  oldText: string,
  newText: string,
): {
  lines: DiffLine[];
  stats: DiffStats;
} {
  const oldLines = oldText ? oldText.split(/\r?\n/) : [];
  const newLines = newText ? newText.split(/\r?\n/) : [];

  const parts = computeLcsDiff(oldLines, newLines);

  let oldNum = 1;
  let newNum = 1;
  const stats: DiffStats = { added: 0, removed: 0, unchanged: 0 };

  const lines: DiffLine[] = parts.map((part) => {
    if (part.type === "added") {
      stats.added++;
      return {
        type: "added",
        newLineNumber: newNum++,
        content: part.value,
      };
    }

    if (part.type === "removed") {
      stats.removed++;
      return {
        type: "removed",
        oldLineNumber: oldNum++,
        content: part.value,
      };
    }

    stats.unchanged++;
    return {
      type: "unchanged",
      oldLineNumber: oldNum++,
      newLineNumber: newNum++,
      content: part.value,
    };
  });

  return { lines, stats };
}

/**
 * Computes Side-by-Side rows (left: old / removed, right: new / added).
 */
export function computeSideBySideDiff(
  oldText: string,
  newText: string,
): {
  rows: SideBySideRow[];
  stats: DiffStats;
} {
  const { lines, stats } = computeLineDiff(oldText, newText);
  const rows: SideBySideRow[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.type === "unchanged") {
      rows.push({
        left: {
          lineNumber: line.oldLineNumber,
          content: line.content,
          type: "unchanged",
        },
        right: {
          lineNumber: line.newLineNumber,
          content: line.content,
          type: "unchanged",
        },
      });
      i++;
    } else if (line.type === "removed") {
      // Look ahead to check if the next line is an addition for alignment
      const nextLine = lines[i + 1];
      if (nextLine && nextLine.type === "added") {
        rows.push({
          left: {
            lineNumber: line.oldLineNumber,
            content: line.content,
            type: "removed",
          },
          right: {
            lineNumber: nextLine.newLineNumber,
            content: nextLine.content,
            type: "added",
          },
        });
        i += 2;
      } else {
        rows.push({
          left: {
            lineNumber: line.oldLineNumber,
            content: line.content,
            type: "removed",
          },
        });
        i++;
      }
    } else {
      // line.type === 'added'
      rows.push({
        right: {
          lineNumber: line.newLineNumber,
          content: line.content,
          type: "added",
        },
      });
      i++;
    }
  }

  return { rows, stats };
}
