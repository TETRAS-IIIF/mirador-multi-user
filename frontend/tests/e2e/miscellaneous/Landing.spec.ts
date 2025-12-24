import { expect, test } from '@playwright/test';
import { mockEnvVars } from '../mock/env';

const SettingKeys = {
  CLASSIC_AUTHENTICATION: 'CLASSIC_AUTHENTICATION',
  OPENID_CONNECTION: 'OPENID_CONNECTION',
  ALLOW_NEW_USER: 'ALLOW_NEW_USER',
} as const;

test.describe.configure({ mode: 'serial' });

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(`
      window.importMetaEnv = ${JSON.stringify(mockEnvVars)};
      window.import = {
        meta: {
          env: window.importMetaEnv
        }
      };
    `);

    await page.route('**/api/settings', (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          [SettingKeys.CLASSIC_AUTHENTICATION]: 'true',
          [SettingKeys.OPENID_CONNECTION]: 'false',
          [SettingKeys.ALLOW_NEW_USER]: 'true',
        }),
      });
    });

    await page.route('**/env-config', (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          VITE_INSTANCE_NAME: mockEnvVars.VITE_INSTANCE_NAME,
        }),
      });
    });
  });

  test.describe('Internationalization', () => {
    const testCases = [
      {
        lang: 'fr',
        translations: {
          welcome: /Bienvenue sur (.+)/i,
          createAccount: /Créer un compte/i,
          login: /Connexion/i,
        },
      },
      {
        lang: 'en',
        translations: {
          welcome: /Welcome to (.+)/i,
          createAccount: /Create account/i,
          login: /Login/i,
        },
      },
    ];

    for (const { lang, translations } of testCases) {
      test(`should display correct ${lang} translations`, async ({ page }) => {
        await page.addInitScript(
          `window.localStorage.setItem('i18nextLng', '${lang}')`,
        );
        await page.goto('/');

        await expect(page.locator('h1')).toContainText(translations.welcome);
        await expect(
          page.getByRole('button', { name: translations.createAccount }),
        ).toBeVisible();
        await expect(
          page.getByRole('button', { name: translations.login }),
        ).toBeVisible();
      });
    }

    test('should fall back to default language when unknown language is set', async ({
      page,
    }) => {
      await page.addInitScript(
        `window.localStorage.setItem('i18nextLng', 'es')`,
      );
      await page.goto('/');
      await expect(page.locator('h1')).toContainText(/Welcome|Bienvenue/);
    });
  });

  test.describe('Authentication Flow', () => {
    test('should show only login button when registration is disabled', async ({
      page,
    }) => {
      await page.route('**/api/settings', (route) => {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            [SettingKeys.CLASSIC_AUTHENTICATION]: 'true',
            [SettingKeys.OPENID_CONNECTION]: 'false',
            [SettingKeys.ALLOW_NEW_USER]: 'false',
          }),
        });
      });

      await page.goto('/');
      await expect(
        page.getByRole('button', { name: /create account|créer un compte/i }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: /login|connexion/i }),
      ).toBeVisible();
    });

    test('should redirect to OIDC when OpenID is enabled and classic auth disabled', async ({
      page,
    }) => {
      await page.route('**/api/settings', (route) => {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            [SettingKeys.CLASSIC_AUTHENTICATION]: 'false',
            [SettingKeys.OPENID_CONNECTION]: 'true',
            [SettingKeys.ALLOW_NEW_USER]: 'true',
          }),
        });
      });

      await page.goto('/');
      await page.getByRole('button', { name: /login|connexion/i }).click();
      await page.waitForURL('**/auth/login');

      await Promise.all([
        page.waitForURL('**/protocol/openid-connect/auth**'),
        page.getByRole('button', { name: /login with openid/i }).click(),
      ]);

      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/protocol\/openid-connect\/auth/);
      expect(currentUrl).toContain('client_id=');
      expect(currentUrl).toContain('redirect_uri=');
      expect(currentUrl).toContain('response_type=code');
    });

    test('should navigate to signin page when classic auth is enabled', async ({
      page,
    }) => {
      await page.goto('/');

      const [navigation] = await Promise.all([
        page.waitForEvent('framenavigated'),
        page
          .getByRole('button', { name: /create account|créer un compte/i })
          .click(),
      ]);

      expect(navigation.url()).toContain('/auth/signin');
    });
  });

  test.describe('Responsiveness', () => {
    const viewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1280, height: 800 },
    ];

    for (const viewport of viewports) {
      test(`should display correctly on ${viewport.width}px viewport`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');
        await expect(page.locator('h1')).toBeVisible();
        await expect(
          page.getByRole('button', { name: /login|connexion/i }),
        ).toBeVisible();

        await expect(page.locator('body')).not.toHaveCSS(
          'overflow-x',
          'scroll',
        );
      });
    }
  });
});
