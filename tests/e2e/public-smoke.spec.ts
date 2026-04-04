import { expect, test } from '@playwright/test';

test.describe('Public smoke', () => {
    test('homepage renders and header search opens the search page', async ({ page }) => {
        await page.goto('/');

        await expect(
            page.getByRole('link', { name: /DevOps Daily/i })
        ).toBeVisible();
        await expect(
            page.getByRole('navigation').getByRole('link', { name: /^Newsletter$/i })
        ).toBeVisible();

        await page.goto('/search');
        await page.getByPlaceholder('Kubernetes, CI/CD, monitoring...').fill('Kubernetes');
        await page.getByRole('button', { name: /^Tim$/i }).click();

        await expect(page).toHaveURL(/\/search\?q=Kubernetes/);
        await expect(
            page.getByRole('heading', { name: /Tim bai viet trong DevOps Daily/i })
        ).toBeVisible();
    });

    test('newsletter page renders subscription UI', async ({ page }) => {
        await page.goto('/newsletter');

        await expect(
            page.getByRole('heading', { name: /Join the list/i })
        ).toBeVisible();
        await expect(
            page.getByPlaceholder('Your name (optional)')
        ).toBeVisible();
        await expect(
            page.getByPlaceholder('Enter your email')
        ).toBeVisible();
        await expect(
            page.getByRole('button', { name: /Join newsletter/i })
        ).toBeVisible();
    });

    test('auth pages render expected forms', async ({ page }) => {
        await page.goto('/login');

        await expect(
            page.getByRole('heading', { name: /Sign in to DevOps Blog/i })
        ).toBeVisible();
        await expect(page.getByPlaceholder('you@devopsblog.com')).toBeVisible();
        await expect(page.getByPlaceholder('Enter your password')).toBeVisible();

        await page.goto('/register');

        await expect(
            page.getByRole('heading', { name: /Create your DevOps Daily account/i })
        ).toBeVisible();
        await expect(page.getByLabel('First Name')).toBeVisible();
        await expect(page.getByLabel('Last Name')).toBeVisible();
        await expect(page.getByLabel('Email Address')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
    });
});
