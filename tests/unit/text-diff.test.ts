import { describe, it } from "node:test";
import assert from "node:assert";
import {
  computeLineDiff,
  computeSideBySideDiff,
  stripHtmlToReadableText,
} from "../../lib/diff/text-diff";

describe("Text Diff Utility", () => {
  it("should strip HTML tags and decode entities properly", () => {
    const html = "<h2>Docker Basics</h2><p>Hello &amp; welcome to DevOps!</p>";
    const text = stripHtmlToReadableText(html);
    assert.strictEqual(text, "Docker Basics\n\nHello & welcome to DevOps!");
  });

  it("should detect added, removed, and unchanged lines", () => {
    const oldText = "Line 1\nLine 2\nLine 3";
    const newText = "Line 1\nLine 2 (Modified)\nLine 3\nLine 4";

    const { lines, stats } = computeLineDiff(oldText, newText);

    assert.strictEqual(stats.removed, 1);
    assert.strictEqual(stats.added, 2);
    assert.strictEqual(stats.unchanged, 2);

    const removed = lines.find((l) => l.type === "removed");
    assert.strictEqual(removed?.content, "Line 2");

    const added = lines.filter((l) => l.type === "added");
    assert.strictEqual(added[0].content, "Line 2 (Modified)");
    assert.strictEqual(added[1].content, "Line 4");
  });

  it("should compute side-by-side rows with proper alignment", () => {
    const oldText = "A\nB\nC";
    const newText = "A\nB_updated\nC";

    const { rows } = computeSideBySideDiff(oldText, newText);

    assert.strictEqual(rows.length, 3);
    assert.strictEqual(rows[0].left?.content, "A");
    assert.strictEqual(rows[0].right?.content, "A");

    // Aligned row for modification
    assert.strictEqual(rows[1].left?.content, "B");
    assert.strictEqual(rows[1].right?.content, "B_updated");

    assert.strictEqual(rows[2].left?.content, "C");
    assert.strictEqual(rows[2].right?.content, "C");
  });
});
