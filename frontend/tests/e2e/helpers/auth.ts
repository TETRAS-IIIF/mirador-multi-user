// tests/helpers/auth.ts
import { BrowserContext, Page } from '@playwright/test';
import { mockUser, mockUserWithTerms } from './data';

type LoginOptions = {
  withTermsValidated?: boolean;
};

export async function mockLogin(
  context: BrowserContext,
  page: Page,
  options: LoginOptions = {},
) {
  const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3000';

  let profileCallCount = 0;

  await context.route(`${backendUrl}/auth/profile`, async (route) => {
    profileCallCount++;

    if (!options.withTermsValidated && profileCallCount === 1) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          options.withTermsValidated ? mockUserWithTerms : mockUserWithTerms,
        ),
      });
    }
  });

  await context.route(`${backendUrl}/auth/valid-terms`, async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    } else {
      await route.continue();
    }
  });

  // ✅ Simulate logged-in user
  await page.addInitScript(() => {
    localStorage.setItem(
      'Mirador-multi-user-token',
      JSON.stringify('mock-token-12345'),
    );
  });
}
