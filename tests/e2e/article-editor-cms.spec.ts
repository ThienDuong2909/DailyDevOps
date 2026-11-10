import { expect, test } from "@playwright/test";

const mockPost = {
  id: "test-article-123",
  title: "Tối ưu hóa Docker Container cho Production 2026",
  slug: "toi-uu-hoa-docker-container-production-2026",
  subtitle: "Hướng dẫn thực chiến từ cơ bản đến nâng cao",
  excerpt: "Hướng dẫn thực chiến từ cơ bản đến nâng cao",
  content:
    "<p>Nội dung phiên bản hiện tại đã được biên tập và cập nhật thêm các mẹo bảo mật.</p>",
  contentHtml:
    "<p>Nội dung phiên bản hiện tại đã được biên tập và cập nhật thêm các mẹo bảo mật.</p>",
  featuredImage: "https://images.unsplash.com/photo-1605745341112-85968b19335b",
  status: "DRAFT",
  locale: "vi",
  createdAt: "2026-03-01T08:00:00.000Z",
  updatedAt: "2026-03-01T10:00:00.000Z",
  category: { id: "cat-1", name: "DevOps", slug: "devops" },
  tags: [{ id: "tag-1", name: "Docker", slug: "docker" }],
  author: { id: "u-1", firstName: "Admin", lastName: "User" },
};

const mockVersions = [
  {
    id: "ver-1",
    postId: "test-article-123",
    versionNumber: 2,
    title: "Tối ưu hóa Docker Container (Bản gốc)",
    slug: "toi-uu-hoa-docker-container-goc",
    subtitle: "Phiên bản sơ khai",
    excerpt: "Phiên bản sơ khai",
    content: "<p>Nội dung ban đầu chưa được biên tập kỹ lưỡng.</p>",
    contentHtml: "<p>Nội dung ban đầu chưa được biên tập kỹ lưỡng.</p>",
    featuredImage: "https://images.unsplash.com/photo-old",
    status: "DRAFT",
    reason: "Lưu bản thảo ban đầu",
    createdAt: "2026-03-01T08:30:00.000Z",
    createdBy: { id: "u-1", firstName: "Admin", lastName: "User" },
  },
];

test.describe("Editorial CMS Reliability - Autosave, Offline Rescue & Visual Diff", () => {
  test.beforeEach(async ({ page }) => {
    // Mock user auth
    await page.addInitScript(() => {
      window.localStorage.setItem("accessToken", "mock-access-token");
      window.localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            isAuthenticated: true,
            isInitialized: true,
            user: {
              id: "u-1",
              email: "admin@devopsblog.com",
              role: "ADMIN",
              firstName: "Admin",
              lastName: "User",
            },
          },
          version: 0,
        }),
      );
    });

    // Mock API endpoints
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: "u-1",
            email: "admin@devopsblog.com",
            role: "ADMIN",
            firstName: "Admin",
            lastName: "User",
          },
        }),
      });
    });

    await page.route("**/api/v1/categories", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [{ id: "cat-1", name: "DevOps", slug: "devops" }],
        }),
      });
    });

    await page.route("**/api/v1/tags", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [{ id: "tag-1", name: "Docker", slug: "docker" }],
        }),
      });
    });

    await page.route(
      "**/api/v1/posts/test-article-123/versions",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: mockVersions,
          }),
        });
      },
    );

    await page.route(
      "**/api/v1/posts/test-article-123/versions/ver-1",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: mockVersions[0],
          }),
        });
      },
    );

    await page.route("**/api/v1/posts/test-article-123", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: mockPost }),
        });
      } else if (
        route.request().method() === "PUT" ||
        route.request().method() === "PATCH"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              ...mockPost,
              updatedAt: new Date().toISOString(),
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/v1/media**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
    });
  });

  test("renders Autosave badge with idle or saved state on editor load", async ({
    page,
  }) => {
    await page.goto("/admin/articles/test-article-123", {
      waitUntil: "domcontentloaded",
    });

    // The status badge should be present in the header
    const badge = page
      .locator("text=Tự động lưu")
      .or(page.locator("text=Đã đồng bộ draft"));
    await expect(badge.first()).toBeVisible({ timeout: 15_000 });
  });

  test("displays Offline Rescue Banner when an unsaved local snapshot is detected", async ({
    page,
  }) => {
    // Inject rescue snapshot into localStorage before load
    await page.addInitScript(() => {
      const rescueData = {
        postId: "test-article-123",
        locale: "vi",
        title: "Bản thảo giải cứu khẩn cấp từ LocalStorage",
        subtitle: "Đoạn trích cứu hộ",
        slug: "ban-thao-giai-cuu-khan-cap",
        content:
          "<p>Nội dung offline chưa kịp gửi lên máy chủ khi rớt mạng</p>",
        featuredImage: "",
        categoryId: "cat-1",
        tagIds: ["tag-1"],
        savedAt: new Date(Date.now() + 60000).toISOString(), // newer than server
      };
      window.localStorage.setItem(
        "devops_daily_rescue_post_test-article-123_vi",
        JSON.stringify(rescueData),
      );
    });

    await page.goto("/admin/articles/test-article-123", {
      waitUntil: "domcontentloaded",
    });

    // Verify rescue banner appears
    const banner = page.getByText(
      /Phát hiện bản thảo chưa lưu trên trình duyệt/i,
    );
    await expect(banner).toBeVisible({ timeout: 15_000 });

    // Check action buttons exist
    const restoreBtn = page.getByRole("button", {
      name: /Khôi phục bản thảo/i,
    });
    const dismissBtn = page.getByRole("button", { name: /Bỏ qua/i });
    await expect(restoreBtn).toBeVisible();
    await expect(dismissBtn).toBeVisible();

    // Click Restore button
    await restoreBtn.click();

    // Verify title input updated to rescued title
    const titleInput = page
      .getByPlaceholder("Tieu de bai viet")
      .or(page.locator('input[type="text"]').first());
    await expect(titleInput).toHaveValue(
      "Bản thảo giải cứu khẩn cấp từ LocalStorage",
    );

    // Banner should disappear after restoration
    await expect(banner).not.toBeVisible();
  });

  test("opens Visual Diff Modal, switches views, and shows comparison details", async ({
    page,
  }) => {
    await page.goto("/admin/articles/test-article-123", {
      waitUntil: "domcontentloaded",
    });

    // Locate the "So sánh Diff" button in Version History card
    const diffButton = page.getByRole("button", { name: /So sánh Diff/i });
    await expect(diffButton).toBeVisible({ timeout: 15_000 });
    await diffButton.click();

    // Verify Visual Diff Modal is opened
    const modalTitle = page.getByText("So sánh phiên bản bài viết");
    await expect(modalTitle).toBeVisible();

    // Verify version select dropdown exists and shows the snapshot version
    const versionSelect = page
      .locator("select")
      .filter({ hasText: /Bản gốc/i });
    await expect(versionSelect).toBeVisible();

    // Verify View Switcher (Unified vs Side-by-side)
    const sideBySideBtn = page.getByRole("button", {
      name: /2 Cột song song/i,
    });
    const unifiedBtn = page.getByRole("button", { name: /Gộp 1 luồng/i });
    await expect(sideBySideBtn).toBeVisible();
    await expect(unifiedBtn).toBeVisible();

    // Switch to Side-by-Side view
    await sideBySideBtn.click();
    await expect(page.getByText("Phiên bản đã chọn")).toBeVisible();
    await expect(page.getByText("Bản thảo hiện tại")).toBeVisible();

    // Toggle Format (Readable Text vs Raw HTML)
    const rawHtmlBtn = page.getByRole("button", { name: /Mã nguồn thô/i });
    await expect(rawHtmlBtn).toBeVisible();
    await rawHtmlBtn.click();
    await expect(page.getByText("<p>")).toBeVisible();

    // Verify Rollback button exists
    const rollbackBtn = page.getByRole("button", {
      name: /Khôi phục phiên bản này/i,
    });
    await expect(rollbackBtn).toBeVisible();

    // Close modal
    const closeBtn = page.getByRole("button", { name: "Đóng" });
    await closeBtn.click();
    await expect(modalTitle).not.toBeVisible();
  });
});
