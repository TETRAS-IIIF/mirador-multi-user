import { expect, test } from '@playwright/test';

test.describe('App is up', () => {
  test('should load the application shell', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('MMU');
    await expect(page.locator('#root')).toBeVisible();
  });

  test('should show login UI', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[name="mail"]')).toBeVisible();

    await expect(page.locator('input[name="password"]')).toBeVisible();

    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await expect(page.getByRole('button', { name: /openid/i })).toBeVisible();
  });
});
