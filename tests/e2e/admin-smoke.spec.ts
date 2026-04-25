import { expect, test } from "@playwright/test";

const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL || "admin@devopsblog.com";
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD || "Admin@123";

test.describe("Admin smoke", () => {
  test("admin can sign in and navigate key admin areas", async ({ page }) => {
    test.skip(!!process.env.CI, "Requires backend API, skipped in CI");

    test.setTimeout(90_000);

    const loginResponse = await page.request.post("/api/v1/auth/login", {
      data: {
        email: adminEmail,
        password: adminPassword,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();

    const payload = (await loginResponse.json()) as {
      data?: {
        accessToken?: string;
      };
    };
    const accessToken = payload?.data?.accessToken;

    expect(accessToken).toBeTruthy();

    await page.addInitScript((token) => {
      window.localStorage.setItem("accessToken", token);
      window.localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            isAuthenticated: true,
          },
          version: 0,
        }),
      );
    }, accessToken as string);

    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/admin$/);
    await expect(
      page.getByRole("heading", { name: /Overview/i }),
    ).toBeVisible();

    await page.goto("/admin/comments", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/comments$/);
    await expect(
      page.getByRole("button", { name: /All Comments/i }),
    ).toBeVisible();

    await page.goto("/admin/media", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/media$/);
    await expect(
      page.getByRole("heading", { name: /Media Library/i }),
    ).toBeVisible();

    await page.goto("/admin/newsletter", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/newsletter$/);
    await expect(
      page.getByRole("heading", { name: /Newsletter Ops/i }),
    ).toBeVisible();
  });
});
