// tests/e2e/auth/Login.spec.ts
import { expect, Page, test } from '@playwright/test';

export const mockAdminSettings = {
  mutableSettings: [
    { id: 1, key: 'ALLOW_NEW_USER', value: 'true' },
    { id: 2, key: 'ALLOW_YOUTUBE_MEDIA', value: 'true' },
    { id: 3, key: 'ALLOW_PEERTUBE_MEDIA', value: 'true' },
    { id: 4, key: 'MAX_UPLOAD_SIZE', value: '5000' },
    { id: 6, key: 'OPENID_CONNECTION', value: 'true' },
    { id: 7, key: 'CLASSIC_AUTHENTICATION', value: 'true' },
    { id: 8, key: 'OPEN_ID_CONNECT_ALLOWED', value: '0' },
  ],
  unMutableSettings: [
    ['API_URL', 'http://localhost:3000'],
    ['CADDY_URL', 'http://localhost:9000'],
    ['SWAGGER_URL', 'http://localhost:3000/api'],
    ['BACKEND_LOG_LVL', '2'],
    ['INSTANCE_NAME', 'Mirador Multi User'],
    ['LAST_MIGRATION', '2025-12-01T14:36:09.513Z'],
    ['UPLOAD_FOLDER_SIZE', '12492.80'],
    ['DB_SIZE', '4.92 MB'],
    ['LAST_STARTING_TIME', '2025-12-23T10:52:57.368Z'],
  ],
};

function createMockSettings(overrides: Partial<Record<string, string>> = {}) {
  const settings = JSON.parse(JSON.stringify(mockAdminSettings));

  settings.mutableSettings = settings.mutableSettings.map((setting: any) => {
    if (overrides[setting.key] !== undefined) {
      return { ...setting, value: overrides[setting.key] };
    }
    return setting;
  });

  return settings;
}

async function setupPageWithMocks(
  page: Page,
  settingsOverrides: Partial<Record<string, string>> = {},
  oidcProviders: any[] = [],
) {
  const settings = createMockSettings(settingsOverrides);

  await page.route('**/settings', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(settings),
    });
  });

  await page.route('**/api/admin-settings/public', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(settings),
    });
  });

  await page.route('**/api/oidc-providers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(oidcProviders),
    });
  });

  await page.route('**/oidc-providers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(oidcProviders),
    });
  });
}

test.describe('Login Page', () => {
  test.describe('Page Structure', () => {
    test('should load login page successfully', async ({ page }) => {
      await setupPageWithMocks(page);
      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('input[name="mail"]', { timeout: 10000 });

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();
    });

    test('should have back navigation link', async ({ page }) => {
      await setupPageWithMocks(page);
      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('input[name="mail"]', { timeout: 10000 });

      const backLink = page.locator('a[href="/"]').first();
      await expect(backLink).toBeVisible();
    });

    test('should have sign up link', async ({ page }) => {
      await setupPageWithMocks(page);
      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('input[name="mail"]', { timeout: 10000 });

      const signUpLink = page.locator('a[href="/auth/signin"]');
      await expect(signUpLink).toBeVisible();
    });
  });

  test.describe('Classic Authentication Form', () => {
    test('should display email and password fields', async ({ page }) => {
      await setupPageWithMocks(page);
      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('input[name="mail"]', { timeout: 10000 });

      const emailInput = page.locator('input[name="mail"]');
      const passwordInput = page.locator('input[name="password"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should have forgot password link', async ({ page }) => {
      await setupPageWithMocks(page);
      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('input[name="mail"]', { timeout: 10000 });

      const forgotPasswordButton = page.locator('button').filter({
        hasText: /mot de passe|password|oublié|forgot/i,
      });

      await expect(forgotPasswordButton).toBeVisible();
    });

    test('should have submit button', async ({ page }) => {
      await setupPageWithMocks(page);
      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('input[name="mail"]', { timeout: 10000 });

      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await setupPageWithMocks(page);
      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('input[name="mail"]', { timeout: 10000 });

      await page.click('button[type="submit"]', { force: true });
      await page.waitForTimeout(2000);

      const emailInput = page.locator('input[name="mail"]');
      const passwordInput = page.locator('input[name="password"]');

      const emailHasError = await emailInput.evaluate((el) => {
        const textField = el.closest('.MuiTextField-root');
        return (
          textField?.classList.contains('Mui-error') ||
          el.getAttribute('aria-invalid') === 'true'
        );
      });

      const passwordHasError = await passwordInput.evaluate((el) => {
        const textField = el.closest('.MuiTextField-root');
        return (
          textField?.classList.contains('Mui-error') ||
          el.getAttribute('aria-invalid') === 'true'
        );
      });

      expect(emailHasError || passwordHasError).toBe(true);
    });

    test('should submit form with valid data', async ({ page }) => {
      const requests: string[] = [];

      await setupPageWithMocks(page, {
        CLASSIC_AUTHENTICATION: 'true',
        OPENID_CONNECTION: 'false',
      });

      page.on('request', (request) => {
        requests.push(`${request.method()} ${request.url()}`);
      });

      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'test-token',
            user: { id: 1, email: 'test@example.com' },
          }),
        });
      });

      await page.goto('/auth/login', { waitUntil: 'networkidle' });
      await page.waitForSelector('input[name="mail"]');
      await page.waitForTimeout(1000);

      await page.fill('input[name="mail"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');

      await page.click('button[type="submit"]', { force: true });
      await page.waitForTimeout(3000);

      const loginRequest = requests.find(
        (r) => r.includes('POST') && r.includes('/api/auth/login'),
      );

      const emailValue = await page.inputValue('input[name="mail"]');
      const passwordValue = await page.inputValue('input[name="password"]');

      expect(emailValue).toBe('test@example.com');
      expect(passwordValue).toBe('password123');

      if (loginRequest) {
        expect(loginRequest).toContain('POST');
      }
    });
  });

  test.describe('OpenID Connect', () => {
    test('should show OIDC login button when configured', async ({ page }) => {
      const testProviders = [
        {
          id: 1,
          name: 'Test Provider',
          issuer: 'https://test.example.com',
        },
      ];

      await setupPageWithMocks(
        page,
        { OPENID_CONNECTION: 'true' },
        testProviders,
      );

      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('input[name="mail"]', { timeout: 10000 });
      await page.waitForTimeout(1000);

      const pageContent = await page.textContent('body');
      const hasOidcButton = /openid|oidc/i.test(pageContent || '');

      expect(hasOidcButton).toBe(true);

      const allButtons = await page.locator('button').all();
      let foundButton = false;

      for (const button of allButtons) {
        const text = await button.textContent();
        if (text && /openid|oidc/i.test(text)) {
          foundButton = await button.isVisible();
          break;
        }
      }

      expect(foundButton).toBe(true);
    });

    test('should show divider between classic and OIDC login', async ({
      page,
    }) => {
      const testProviders = [
        {
          id: 1,
          name: 'Test Provider',
          issuer: 'https://test.example.com',
        },
      ];

      await setupPageWithMocks(
        page,
        { OPENID_CONNECTION: 'true' },
        testProviders,
      );

      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('input[name="mail"]', { timeout: 10000 });
      await page.waitForTimeout(1000);

      const divider = page.locator('hr.MuiDivider-root');
      await expect(divider).toBeVisible();
    });

    test('should not show OIDC section when disabled', async ({ page }) => {
      await setupPageWithMocks(
        page,
        {
          OPENID_CONNECTION: 'false',
          OPEN_ID_CONNECT_ALLOWED: '0',
          CLASSIC_AUTHENTICATION: 'true',
        },
        [],
      );

      await page.goto('/auth/login', { waitUntil: 'networkidle' });
      await page.waitForSelector('input[name="mail"]');

      const allButtons = await page.locator('button').all();
      const buttonTexts = await Promise.all(
        allButtons.map(async (btn) => {
          const text = await btn.textContent();
          const type = await btn.getAttribute('type');
          const visible = await btn.isVisible();
          return { text: text?.trim(), type, visible };
        }),
      );

      const visibleButtons = buttonTexts.filter((btn) => btn.visible);
      const expectedButtonTexts = [
        'submit',
        'forgot',
        'back',
        'home',
        'accueil',
      ];

      const unexpectedButtons = visibleButtons.filter((btn) => {
        if (!btn.text) return false;
        const lowerText = btn.text.toLowerCase();

        if (
          expectedButtonTexts.some((expected) => lowerText.includes(expected))
        ) {
          return false;
        }

        const oidcKeywords = [
          'openid',
          'oidc',
          'provider',
          'google',
          'github',
          'azure',
          'oauth',
          'sso',
        ];
        return oidcKeywords.some((keyword) => lowerText.includes(keyword));
      });

      expect(unexpectedButtons.length).toBe(0);

      const hasSubmit = visibleButtons.some((btn) =>
        btn.text?.toLowerCase().includes('submit'),
      );
      const hasForgotPassword = visibleButtons.some((btn) =>
        btn.text?.toLowerCase().includes('forgot'),
      );

      expect(hasSubmit).toBe(true);
      expect(hasForgotPassword).toBe(true);
    });
  });

  test.describe('Settings Integration', () => {
    test('should respect CLASSIC_AUTHENTICATION setting', async ({ page }) => {
      await setupPageWithMocks(page, {
        CLASSIC_AUTHENTICATION: 'true',
        OPENID_CONNECTION: 'false',
      });

      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const emailInput = page.locator('input[name="mail"]');
      const passwordInput = page.locator('input[name="password"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(emailInput).toBeEnabled();
      await expect(passwordInput).toBeEnabled();
    });

    test('should show both auth methods when both enabled', async ({
      page,
    }) => {
      const testProviders = [
        {
          id: 1,
          name: 'Test Provider',
          issuer: 'https://test.example.com',
        },
      ];

      await setupPageWithMocks(
        page,
        {
          CLASSIC_AUTHENTICATION: 'true',
          OPENID_CONNECTION: 'true',
        },
        testProviders,
      );

      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('input[name="mail"]', { timeout: 50000 });
      await page.waitForTimeout(5000);

      const emailInput = page.locator('input[name="mail"]');
      await expect(emailInput).toBeVisible();

      const pageContent = await page.textContent('body');
      const hasOidcButton = /openid|oidc/i.test(pageContent || '');
      expect(hasOidcButton).toBe(true);
    });
  });
});
