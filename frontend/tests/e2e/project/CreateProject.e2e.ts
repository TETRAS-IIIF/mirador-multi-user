import { expect, test } from '@playwright/test';
import { mockLogin } from '../helpers/auth';
import { mockAppRoutes } from '../helpers/routes';

test.describe('Create Project', () => {
  test('should create a new project successfully', async ({
    page,
    context,
  }) => {
    await context.addInitScript(() => {
      localStorage.setItem('i18nextLng', 'en');
      localStorage.setItem('lang', 'en');
    });

    await mockLogin(context, page, { withTermsValidated: true });
    await mockAppRoutes(context);

    await page.goto('http://localhost:4000/app/my-projects');

    await page.getByRole('button', { name: /new project/i }).click();

    const projectName = 'super !';

    const dialog = page.getByRole('dialog');

    await dialog.getByRole('textbox').fill(projectName);

    await dialog.getByRole('button', { name: /^add$/i }).click();

    await expect(
      page.getByRole('heading', { name: projectName }),
    ).toBeVisible();
  });
});
