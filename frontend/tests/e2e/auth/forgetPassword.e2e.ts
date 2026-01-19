import { expect, test } from '@playwright/test';

const mockUser = { mail: 'test@example.com' };

const isForgotPasswordEndpoint = (url: string) => {
  try {
    return new URL(url).pathname.endsWith('/auth/forgot-password');
  } catch {
    return url.includes('/auth/forgot-password');
  }
};

test.describe('Auth / forgot password (backend validation)', () => {
  test('success shows success message', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'fr'));

    await page.route('**/*', async (route) => {
      const req = route.request();
      if (req.method() !== 'POST') return route.continue();
      if (!isForgotPasswordEndpoint(req.url())) return route.continue();

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Password reset email sent',
        }),
      });
    });

    await page.goto('/forgot-password');

    const emailInput = page.getByRole('textbox', { name: /courriel|email/i });
    await emailInput.waitFor();
    await emailInput.fill(mockUser.mail);

    await page.getByRole('button', { name: /envoyer|send/i }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText(
      /lien de réinitialisation|password reset|email.*sent/i,
    );
  });

  test('non-existent email shows success message (security)', async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'fr'));

    await page.route('**/*', async (route) => {
      const req = route.request();
      if (req.method() !== 'POST') return route.continue();
      if (!isForgotPasswordEndpoint(req.url())) return route.continue();

      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto('/forgot-password');

    const emailInput = page.getByRole('textbox', { name: /courriel|email/i });
    await emailInput.waitFor();
    await emailInput.fill('nonexistent@example.com');

    await page.getByRole('button', { name: /envoyer|send/i }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText(
      /lien de réinitialisation|password reset|si un utilisateur existe/i,
    );
  });

  test('rate limit shows success message (security)', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'fr'));

    await page.route('**/*', async (route) => {
      const req = route.request();
      if (req.method() !== 'POST') return route.continue();
      if (!isForgotPasswordEndpoint(req.url())) return route.continue();

      return route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto('/forgot-password');

    const emailInput = page.getByRole('textbox', { name: /courriel|email/i });
    await emailInput.waitFor();
    await emailInput.fill(mockUser.mail);

    await page.getByRole('button', { name: /envoyer|send/i }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText(
      /lien de réinitialisation|password reset|si un utilisateur existe/i,
    );
  });

  test('server error shows success message (security)', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'fr'));

    await page.route('**/*', async (route) => {
      const req = route.request();
      if (req.method() !== 'POST') return route.continue();
      if (!isForgotPasswordEndpoint(req.url())) return route.continue();

      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto('/forgot-password');

    const emailInput = page.getByRole('textbox', { name: /courriel|email/i });
    await emailInput.waitFor();
    await emailInput.fill(mockUser.mail);

    await page.getByRole('button', { name: /envoyer|send/i }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText(
      /lien de réinitialisation|password reset|si un utilisateur existe/i,
    );
  });
});
