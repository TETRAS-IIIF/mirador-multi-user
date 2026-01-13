import { expect, test } from '@playwright/test';

const mockUser = { name: 'oo', mail: 'test@example.com' };

const isRegisterEndpoint = (url: string) => {
  try {
    return new URL(url).pathname.endsWith('/link-user-group/user');
  } catch {
    return url.includes('/link-user-group/user');
  }
};

test.describe('Auth / register', () => {
  test('success shows success card', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'fr'));

    await page.route('**/*', async (route) => {
      const req = route.request();
      if (req.method() !== 'POST') return route.continue();
      if (!isRegisterEndpoint(req.url())) return route.continue();

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-id',
          name: mockUser.name,
          mail: mockUser.mail,
        }),
      });
    });

    await page.goto('/auth/signin');

    await page.locator('input[name="mail"]').fill(mockUser.mail);
    await page.locator('input[name="name"]').fill(mockUser.name);
    await page.locator('input[name="password"]').fill('changeme');
    await page.locator('input[name="confirmPassword"]').fill('changeme');

    await page.locator('button[type="submit"]').click();

    await expect(
      page.getByText(/compte créé avec succès|account created/i),
    ).toBeVisible({ timeout: 30_000 });

    await expect(
      page.getByText(/veuillez vérifier votre e-mail|check (your )?e-?mail/i),
    ).toBeVisible();
  });

  test('duplicate shows snackbar message', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'fr'));

    await page.route('**/*', async (route) => {
      const req = route.request();
      if (req.method() !== 'POST') return route.continue();
      if (!isRegisterEndpoint(req.url())) return route.continue();

      return route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto('/auth/signin');

    await page.locator('input[name="mail"]').fill(mockUser.mail);
    await page.locator('input[name="name"]').fill(mockUser.name);
    await page.locator('input[name="password"]').fill('changeme');
    await page.locator('input[name="confirmPassword"]').fill('changeme');

    await page.locator('button[type="submit"]').click();

    await expect(
      page.getByText(/a user with this email or username already exists/i),
    ).toBeVisible({ timeout: 30_000 });

    await expect(
      page.getByText(/compte créé avec succès|account created/i),
    ).toHaveCount(0);
  });
});
