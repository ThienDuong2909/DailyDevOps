import { expect, test } from "@playwright/test";

test.describe("Public smoke", () => {
  test("english locale cookie localizes clean public routes", async ({
    context,
    page,
  }) => {
    await context.addCookies([
      {
        name: "preferred_locale",
        value: "en",
        url: "http://localhost:3000",
      },
    ]);

    await page.goto("/");

    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("button", { name: "Switch language" }),
    ).toHaveAttribute("title", "Language: English");

    await page.goto("/category");

    await expect(page).toHaveURL("/category");
    await expect(
      page.getByRole("heading", { name: /All articles/i }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Search articles...")).toBeVisible();
  });

  test("homepage renders and category listing preserves URL filters and legacy /blog redirects", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: /Daily DevOps/i }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation")
        .getByRole("link", { name: /^Newsletter$|^Bản tin$/i }),
    ).toBeVisible();

    await page.goto("/blog");
    await expect(page).toHaveURL("/category");

    await page.getByPlaceholder(/Tìm kiếm bài viết/i).fill("Kubernetes");

    await expect(page).toHaveURL(/\/category\?q=Kubernetes/);
    await expect(
      page.getByRole("heading", {
        name: /Tất cả bài viết|All articles/i,
      }),
    ).toBeVisible();
  });

  test("switches locale via desktop header switcher, preserves homepage topic, and survives reload", async ({
    context,
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("button", { name: "Switch language" }),
    ).toHaveAttribute("title", "Language: Tiếng Việt");

    const monitoringTopic = page.getByRole("button", {
      name: /^Monitoring$/i,
    });
    if ((await monitoringTopic.count()) > 0) {
      await monitoringTopic.first().click();
      await expect(monitoringTopic.first()).toHaveClass(/theme-glow-button/);
    }

    await page.getByRole("button", { name: "Switch language" }).click();

    const setEnPromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/set-locale") &&
        res.request().method() === "POST" &&
        res.status() === 200,
    );
    await page.getByRole("button", { name: /English/i }).click();
    await setEnPromise;

    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("button", { name: "Switch language" }),
    ).toHaveAttribute("title", "Language: English");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("button", { name: /^All articles$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Most read$/i }),
    ).toBeVisible();

    if ((await monitoringTopic.count()) > 0) {
      await expect(monitoringTopic.first()).toHaveClass(/theme-glow-button/);
    }

    const cookiesAfterEn = await context.cookies();
    expect(
      cookiesAfterEn.find((c) => c.name === "preferred_locale")?.value,
    ).toBe("en");

    await page.reload();
    await expect(
      page.getByRole("button", { name: "Switch language" }),
    ).toHaveAttribute("title", "Language: English");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.getByRole("button", { name: "Switch language" }).click();
    const setViPromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/set-locale") &&
        res.request().method() === "POST" &&
        res.status() === 200,
    );
    await page.getByRole("button", { name: /Tiếng Việt/i }).click();
    await setViPromise;

    await expect(
      page.getByRole("button", { name: "Switch language" }),
    ).toHaveAttribute("title", "Language: Tiếng Việt");
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  });

  test("switches locale from mobile menu on /category while preserving URL query", async ({
    context,
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/category?q=Kubernetes");

    await expect(
      page.getByRole("heading", { name: /^Tất cả bài viết$/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Mở menu|Open menu/i }).click();

    const setEnPromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/set-locale") &&
        res.request().method() === "POST" &&
        res.status() === 200,
    );
    await page.getByRole("button", { name: "Switch to English" }).click();
    await setEnPromise;

    await expect(page).toHaveURL(/\/category\?q=Kubernetes/);
    await expect(
      page.getByRole("heading", { name: /^All articles$/i }),
    ).toBeVisible();

    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "preferred_locale")?.value).toBe(
      "en",
    );
  });

  test("newsletter page renders subscription UI", async ({ page }) => {
    await page.goto("/newsletter");

    await expect(
      page.getByRole("heading", { name: /Tham gia danh sách|Join the list/i }),
    ).toBeVisible();
    await expect(page.getByPlaceholder(/Tên của bạn|Your name/i)).toBeVisible();
    await expect(
      page.getByPlaceholder(/Nhập email|Enter your email/i),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Nhận bản tin|Join newsletter/i }),
    ).toBeVisible();
  });

  test("auth pages render expected forms", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: /Sign in to DevOps Blog/i }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("you@devopsblog.com")).toBeVisible();
    await expect(page.getByPlaceholder("Enter your password")).toBeVisible();

    await page.goto("/register");

    await expect(
      page.getByRole("heading", { name: /Create your DevOps Daily account/i }),
    ).toBeVisible();
    await expect(page.getByLabel("First Name")).toBeVisible();
    await expect(page.getByLabel("Last Name")).toBeVisible();
    await expect(page.getByLabel("Email Address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });
});
