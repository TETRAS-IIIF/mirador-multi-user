import { expect, test } from '@playwright/test';

/**
 * Project edit modal, "Assistant" tab, against the real local MMU stack.
 * Needs the frontend served with VITE_ASSISTANT_URL set, and the e2e account
 * (E2E_USER_MAIL / E2E_USER_PASSWORD). Skipped unless E2E_REAL_BACKEND is set.
 */
const BACKEND = process.env.VITE_BACKEND_URL || 'http://localhost:3000';
const MAIL = process.env.E2E_USER_MAIL || 'claude@tetras-libre.fr';
const PASSWORD = process.env.E2E_USER_PASSWORD || 'claudeclaude';

test.skip(
  !process.env.E2E_REAL_BACKEND,
  'Needs the real local MMU stack (E2E_REAL_BACKEND=1)',
);

test('the Assistant tab saves the settings into the project metadata, keeping the rest', async ({
  page,
  request,
}) => {
  const login = await request.post(`${BACKEND}/auth/login`, {
    data: { mail: MAIL, password: PASSWORD },
  });
  const { access_token: token } = await login.json();
  const auth = { Authorization: `Bearer ${token}` };
  const profile = await (
    await request.get(`${BACKEND}/auth/profile`, { headers: auth })
  ).json();
  const title = `E2E assistant settings ${Date.now()}`;
  const created = await request.post(`${BACKEND}/link-group-project/project/`, {
    headers: auth,
    data: { title, ownerId: profile.id, metadata: { foo: 'bar' } },
  });
  const projectId: number = (await created.json()).project.id;
  const readMetadata = async () => {
    const list = await (
      await request.get(
        `${BACKEND}/link-group-project/user/projects/${profile.id}`,
        { headers: auth },
      )
    ).json();
    const projects = (Array.isArray(list) ? list : (list.projects ?? [])).map(
      (p: { project?: unknown }) => p.project ?? p,
    );
    return projects.find((p: { id: number }) => p.id === projectId).metadata;
  };
  const before = await readMetadata();

  await page.addInitScript((value) => {
    localStorage.setItem('Mirador-multi-user-token', JSON.stringify(value));
  }, token);
  const openTab = async () => {
    await page.goto('/app/my-projects');
    const terms = page.getByRole('button', { name: /validate terms of use/i });
    const filter = page.getByLabel(/filter projects/i);
    await expect(terms.or(filter)).toBeVisible();
    if (await terms.isVisible()) {
      await page.getByRole('checkbox').check();
      await terms.click();
    }
    await filter.fill(title);
    await expect(page.getByText(title, { exact: true })).toHaveCount(1);
    await page.getByRole('button', { name: 'Configuration' }).click();
    await page.getByRole('tab', { name: /assistant/i }).click();
    return page.getByTestId('assistant-settings');
  };

  const settings = await openTab();
  await settings.getByRole('switch').check();
  await settings
    .getByLabel(/instructions for the assistant/i)
    .fill('Answer in French. Use the tags person, place.');
  await page.getByRole('button', { name: /save/i }).click();

  await expect.poll(readMetadata).toEqual({
    ...before,
    assistantEnabled: true,
    assistantInstructions: 'Answer in French. Use the tags person, place.',
  });

  // Reopened, the tab shows what was saved.
  const reopened = await openTab();
  await expect(reopened.getByRole('switch')).toBeChecked();
  await expect(
    reopened.getByLabel(/instructions for the assistant/i),
  ).toHaveValue('Answer in French. Use the tags person, place.');
});
