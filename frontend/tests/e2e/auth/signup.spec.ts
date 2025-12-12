import { expect, test } from '@playwright/test';

const mockUser = {
  mail: 'antoine.roy+t@tetras-libre.fr',
  name: 'oo',
  password: '$2b$10$sNq6SFS93dWaStqwHbctIe3IRLcbdmxZu5gp8Z69sAny3/iy9rvLy',
  confirmPassword: 'changeme',
  preferredLanguage: 'fr',
  resetToken: null,
  lastConnectedAt: null,
  termsValidatedAt: null,
  id: 42,
  createdAt: '2025-12-12T13:39:33.000Z',
  _isAdmin: false,
  isEmailConfirmed: false,
  loginCounter: 0,
};

test.describe('Auth / signup (with backend validation)', () => {
  test('shows success card after successful user creation', async ({
    page,
  }) => {
    // Intercept ALL /auth/* POSTs on the frontend origin.
    // Detect the signup call by its payload (contains "confirmPassword").
    await page.route('**/auth/**', async (route) => {
      const req = route.request();

      if (req.method() !== 'POST') {
        await route.continue();
        return;
      }

      const postData = req.postData() || '';

      // Heuristic: signup payload contains confirmPassword.
      if (postData.includes('confirmPassword')) {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(mockUser),
        });
        return;
      }

      // Any other /auth POST (login, refresh, etc.) goes through.
      await route.continue();
    });

    // Go to the signup page – this is the page whose DOM you pasted.
    await page.goto('/auth/signin');

    // Fill form
    await page.locator('input[name="mail"]').fill(mockUser.mail);
    await page.locator('input[name="name"]').fill(mockUser.name || 'E2E User');
    await page.locator('input[name="password"]').fill('changeme');
    await page.locator('input[name="confirmPassword"]').fill('changeme');

    // Submit
    await page.locator('button[type="submit"]').click();

    // Now the frontend has received a 201 + user payload from our mock.
    // It MUST show the success card, otherwise the implementation is wrong.

    await expect(page.getByText(/compte créé avec succès/i)).toBeVisible({
      timeout: 30_000,
    });

    await expect(
      page.getByText(
        /veuillez vérifier votre e-mail pour valider votre compte/i,
      ),
    ).toBeVisible();

    // And the signup layout stays around with its header + link
    await expect(
      page.getByRole('heading', { name: /créez votre compte/i }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /connexion/i })).toBeVisible();
  });
});
