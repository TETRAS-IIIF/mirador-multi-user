import { expect, test } from '@playwright/test';

/**
 * Smoke test of a deployed instance, in a real browser: `just smoke-browser <url>`.
 * Read-only: it creates nothing. Skipped unless SMOKE_DEPLOY is set, so it
 * never runs with the other e2e tests (which mock the backend).
 *
 *   PLAYWRIGHT_BASE_URL  the instance's frontend URL
 *   SMOKE_MAIL / SMOKE_PASSWORD  optional: also log in with that account
 */
const MAIL = process.env.SMOKE_MAIL;
const PASSWORD = process.env.SMOKE_PASSWORD;

test.skip(!process.env.SMOKE_DEPLOY, 'Run with `just smoke-browser <url>`');

test('the app loads without errors and offers a way to log in', async ({
  page,
}) => {
  const failures: string[] = [];
  page.on('pageerror', (error) =>
    failures.push(`page error: ${error.message}`),
  );
  page.on('requestfailed', (request) =>
    failures.push(`request failed: ${request.url()}`),
  );
  page.on('response', (response) => {
    if (response.status() >= 500) {
      failures.push(`${response.status()} from ${response.url()}`);
    }
  });

  await page.goto('/auth/login');
  await expect(page.locator('#root')).toBeVisible();
  const classic = page.locator('input[name="mail"]');
  const openId = page.getByRole('button', { name: /openid/i });
  await expect(classic.or(openId).first()).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(failures).toEqual([]);
});

test('an account can log in and see its projects', async ({ page }) => {
  test.skip(!MAIL || !PASSWORD, 'Set SMOKE_MAIL and SMOKE_PASSWORD to log in');
  await page.goto('/auth/login');
  await page.locator('input[name="mail"]').fill(MAIL!);
  await page.locator('input[name="password"]').fill(PASSWORD!);
  await page.locator('button[type="submit"]').click();

  // First login: the terms of use come first.
  const terms = page.getByRole('button', { name: /validate terms of use/i });
  const projects = page.getByLabel(/filter projects/i);
  await expect(terms.or(projects)).toBeVisible();
  if (await terms.isVisible()) {
    await page.getByRole('checkbox').check();
    await terms.click();
  }
  await expect(projects).toBeVisible();
});
