import { describe, it } from "node:test";
import assert from "node:assert";
import {
  isRescueNewerThanServer,
  getRescueKey,
} from "../../lib/rescue/offline-rescue";

describe("Offline Rescue Utility", () => {
  it("should generate proper rescue key with locale", () => {
    assert.strictEqual(
      getRescueKey("post-123", "vi"),
      "devops_daily_rescue_post_post-123_vi",
    );
    assert.strictEqual(
      getRescueKey("post-123", "en"),
      "devops_daily_rescue_post_post-123_en",
    );
  });

  it("should return false if rescue snapshot is null or empty", () => {
    assert.strictEqual(isRescueNewerThanServer(null), false);
    assert.strictEqual(
      isRescueNewerThanServer({
        postId: "post-1",
        locale: "vi",
        timestamp: Date.now(),
        title: "",
        subtitle: "",
        slug: "",
        content: "",
        contentJson: null,
        featuredImage: "",
        status: "DRAFT",
        categoryId: "",
        tagIds: [],
        scheduledAt: "",
      }),
      false,
    );
  });

  it("should detect when rescue is newer than serverUpdatedAt", () => {
    const serverTime = new Date("2026-11-10T12:00:00.000Z").getTime();
    const newerRescueTime = serverTime + 5000; // 5 seconds newer
    const olderRescueTime = serverTime - 5000; // 5 seconds older

    const rescueSnapshotBase = {
      postId: "post-1",
      locale: "vi" as const,
      title: "Tiêu đề mới",
      subtitle: "",
      slug: "tieu-de-moi",
      content: "<p>Nội dung mới</p>",
      contentJson: null,
      featuredImage: "",
      status: "DRAFT" as const,
      categoryId: "",
      tagIds: [],
      scheduledAt: "",
    };

    assert.strictEqual(
      isRescueNewerThanServer(
        { ...rescueSnapshotBase, timestamp: newerRescueTime },
        "2026-11-10T12:00:00.000Z",
      ),
      true,
    );

    assert.strictEqual(
      isRescueNewerThanServer(
        { ...rescueSnapshotBase, timestamp: olderRescueTime },
        "2026-11-10T12:00:00.000Z",
      ),
      false,
    );
  });
});
