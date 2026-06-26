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

    await page.goto("/blog");

    await expect(page).toHaveURL("/blog");
    await expect(
      page.getByRole("heading", { name: /All articles/i }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Search articles...")).toBeVisible();
  });

  test("homepage renders and header search opens the search page", async ({
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
    await page.getByPlaceholder(/Tìm kiếm bài viết/i).fill("Kubernetes");

    await expect(page).toHaveURL(/\/blog\?q=Kubernetes/);
    await expect(
      page.getByRole("heading", {
        name: /Tất cả bài viết|All articles/i,
      }),
    ).toBeVisible();
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
