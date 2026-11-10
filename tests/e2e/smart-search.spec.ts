import { expect, test } from "@playwright/test";

const mockSearchIndex = {
  version: "1.0.0",
  posts: [
    {
      id: "post-docker-1",
      title: "Hướng dẫn tối ưu Docker Container trong Production",
      slug: "huong-dan-toi-uu-docker-container-production",
      excerpt:
        "Các kỹ thuật giảm dung lượng Docker Image, multi-stage build và bảo mật container.",
      category: {
        name: "Docker & Container",
        slug: "docker-container",
        color: "#0ea5e9",
      },
      tags: ["docker", "container", "devops"],
      publishedAt: "2026-03-01T00:00:00.000Z",
    },
    {
      id: "post-k8s-1",
      title: "Triển khai Kubernetes Cluster với K3s siêu nhẹ",
      slug: "trien-khai-kubernetes-cluster-voi-k3s-sieu-nhe",
      excerpt:
        "Hướng dẫn chi tiết cài đặt k8s cluster bằng k3s cho môi trường production và lab.",
      category: { name: "Kubernetes", slug: "kubernetes", color: "#3b82f6" },
      tags: ["kubernetes", "k8s", "k3s"],
      publishedAt: "2026-03-05T00:00:00.000Z",
    },
    {
      id: "post-cicd-1",
      title: "Xây dựng CI/CD Pipeline với GitHub Actions",
      slug: "xay-dung-cicd-pipeline-voi-github-actions",
      excerpt:
        "Tự động hóa build, test và deploy ứng dụng lên Cloud sử dụng CI/CD workflows.",
      category: {
        name: "CI/CD & Automation",
        slug: "ci-cd-automation",
        color: "#10b981",
      },
      tags: ["cicd", "github-actions", "devops"],
      publishedAt: "2026-03-10T00:00:00.000Z",
    },
  ],
  categories: [
    { name: "Docker & Container", slug: "docker-container" },
    { name: "Kubernetes", slug: "kubernetes" },
    { name: "CI/CD & Automation", slug: "ci-cd-automation" },
  ],
  tags: [
    { name: "docker", slug: "docker" },
    { name: "kubernetes", slug: "kubernetes" },
    { name: "cicd", slug: "cicd" },
    { name: "k8s", slug: "k8s" },
  ],
};

test.describe("Smart Search System (Full-text, Fuzzy, Typo-tolerant, Aliases & /search)", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept search-index endpoint with mock data
    await page.route("**/api/v1/posts/search-index*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: mockSearchIndex,
        }),
      });
    });
  });

  test("1. Opens Command Palette Modal via shortcut (Ctrl+K) and header button, closes on Escape", async ({
    page,
  }) => {
    await page.goto("/");

    // Open via desktop header search button
    const searchTrigger = page.locator('[aria-label*="Tìm kiếm"]').first();
    await expect(searchTrigger).toBeVisible();
    await searchTrigger.click();

    // Verify modal appears
    const modalInput = page.locator('input[placeholder*="Tìm kiếm"]').first();
    await expect(modalInput).toBeVisible();
    await expect(modalInput).toBeFocused();

    // Close via Escape key
    await page.keyboard.press("Escape");
    await expect(modalInput).not.toBeVisible();

    // Open via Keyboard shortcut Ctrl+K
    await page.keyboard.press("Control+k");
    await expect(modalInput).toBeVisible();
    await expect(modalInput).toBeFocused();
  });

  test("2. Typo-tolerant search: Typing 'dockerr' matches Docker article", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");

    const modalInput = page.locator('input[placeholder*="Tìm kiếm"]').first();
    await modalInput.fill("dockerr");

    // Expect Docker article to be found despite the typo
    const dockerResult = page
      .getByText(/Hướng dẫn tối ưu Docker Container/i)
      .first();
    await expect(dockerResult).toBeVisible();
  });

  test("3. DevOps Tech Alias: Typing 'k8s' matches Kubernetes article", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");

    const modalInput = page.locator('input[placeholder*="Tìm kiếm"]').first();
    await modalInput.fill("k8s");

    // Expect Kubernetes article to be found via alias
    const k8sResult = page.getByText(/Triển khai Kubernetes Cluster/i).first();
    await expect(k8sResult).toBeVisible();
  });

  test("4. Keyboard navigation: ArrowDown and Enter selects and navigates to post", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");

    const modalInput = page.locator('input[placeholder*="Tìm kiếm"]').first();
    await modalInput.fill("pipeline");

    // Verify item is present
    await expect(
      page.getByText(/Xây dựng CI\/CD Pipeline/i).first(),
    ).toBeVisible();

    // Press ArrowDown to select item
    await page.keyboard.press("ArrowDown");
    // Press Enter to navigate
    await page.keyboard.press("Enter");

    // Should navigate to article slug URL
    await expect(page).toHaveURL(/xay-dung-cicd-pipeline-voi-github-actions/);
  });

  test("5. Dedicated Search Page (/search?q=docker): Renders results, category filters, and active pills", async ({
    page,
  }) => {
    await page.goto("/search?q=docker");

    // Main search input reflects query param
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toHaveValue("docker");

    // Results grid contains Docker post
    await expect(
      page.getByText(/Hướng dẫn tối ưu Docker Container/i).first(),
    ).toBeVisible();

    // Category filter button exists with count
    const dockerCategoryBtn = page
      .getByRole("button", { name: /Docker & Container/i })
      .first();
    await expect(dockerCategoryBtn).toBeVisible();

    // Click category filter
    await dockerCategoryBtn.click();
    await expect(page).toHaveURL(/category=docker-container/);

    // Active category filter chip should be visible
    const clearCategoryBtn = page
      .getByRole("button", { name: /Bỏ chọn chuyên mục|Remove category/i })
      .first();
    await expect(clearCategoryBtn).toBeVisible();
  });

  test("6. Search Page Empty State: Shows friendly message and trending topic buttons", async ({
    page,
  }) => {
    await page.goto("/search?q=nonexistentterm12345");

    // Verify friendly empty state message
    await expect(
      page
        .getByText(/Không tìm thấy bài viết phù hợp|No articles found/i)
        .first(),
    ).toBeVisible();

    // Verify trending topic button exists
    const kubernetesPill = page
      .getByRole("button", { name: /^Kubernetes$/i })
      .first();
    await expect(kubernetesPill).toBeVisible();

    // Click trending pill
    await kubernetesPill.click();

    // URL should update to q=Kubernetes
    await expect(page).toHaveURL(/q=Kubernetes/);
    await expect(
      page.getByText(/Triển khai Kubernetes Cluster/i).first(),
    ).toBeVisible();
  });
});
