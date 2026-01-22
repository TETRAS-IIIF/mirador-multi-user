import { expect, test } from '@playwright/test';
import { mockLogin } from '../helpers/auth';
import { mockAppRoutes } from '../helpers/routes';

test('should access my projects when terms already validated', async ({
  page,
  context,
}) => {
  await mockLogin(context, page, { withTermsValidated: true });
  await mockAppRoutes(context);

  await page.goto('/app/my-projects', { waitUntil: 'networkidle' });

  await expect(
    page.getByRole('heading', { name: /validate terms of use/i }),
  ).not.toBeVisible();

  await expect(
    page.getByText('Mon Premier Projet', { exact: true }),
  ).toBeVisible();
});
