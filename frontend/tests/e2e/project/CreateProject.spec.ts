import { expect, test } from '@playwright/test';
import { mockLogin } from '../helpers/auth';
import { mockAppRoutes } from '../helpers/routes';

test.describe('Create Project', () => {
  test('should create a new project successfully', async ({
    page,
    context,
  }) => {
    // ─────────────────────────────────────────────────────────────
    // Arrange — force app language to English (before navigation)
    // ─────────────────────────────────────────────────────────────
    await context.addInitScript(() => {
      localStorage.setItem('i18nextLng', 'en');
      localStorage.setItem('lang', 'en');
    });

    await mockLogin(context, page, { withTermsValidated: true });
    await mockAppRoutes(context);

    await page.goto('http://localhost:4000/app/my-projects');

    // ─────────────────────────────────────────────────────────────
    // Act — open create project dialog
    // ─────────────────────────────────────────────────────────────
    await page.getByRole('button', { name: /new project/i }).click();

    const projectName = 'super !';

    const dialog = page.getByRole('dialog');

    await dialog.getByRole('textbox').fill(projectName);

    // ─────────────────────────────────────────────────────────────
    // Act — submit project
    // ─────────────────────────────────────────────────────────────
    await dialog.getByRole('button', { name: /^add$/i }).click();

    // ─────────────────────────────────────────────────────────────
    // Assert — project appears in the list (source of truth)
    // ─────────────────────────────────────────────────────────────
    await expect(
      page.getByRole('heading', { name: projectName }),
    ).toBeVisible();

    // Optional: explicitly assert dialog behavior if desired
    // await expect(dialog).toBeVisible();
  });
});
