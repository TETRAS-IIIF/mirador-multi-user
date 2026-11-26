import { expect, test } from '@playwright/test';
import { mockLogin } from '../helpers/auth';
import { mockAppRoutes } from '../helpers/routes';
import { mockUserWithTerms } from '../helpers/data';

/**
 * Admin panel, "Assistant usage" section, with MMU and the assistant mocked.
 * Needs the frontend served with VITE_ASSISTANT_URL set (default below).
 */
const BACKEND = process.env.VITE_BACKEND_URL || 'http://localhost:3000';
const ASSISTANT = (
  process.env.VITE_ASSISTANT_URL || 'http://localhost:3100'
).replace(/\/+$/, '');

const admin = { ...mockUserWithTerms, _isAdmin: true };

const totals = (costUsd: number, answers: number, tokens: number) => ({
  inputTokens: Math.round(tokens * 0.6),
  outputTokens: Math.round(tokens * 0.1),
  cacheReadTokens: Math.round(tokens * 0.3),
  cacheWriteTokens: 0,
  tokens,
  costUsd,
  answers,
  apiCalls: answers * 3,
  cacheHitRate: 0.3,
});

function summary(from: string, to: string) {
  const days = [];
  const d = new Date(`${from}T00:00:00Z`);
  for (let i = 0; d <= new Date(`${to}T00:00:00Z`); i++) {
    if (i % 3 !== 1) {
      const opus = 0.4 + ((i * 37) % 10) / 10;
      const haiku = ((i * 13) % 5) / 20;
      days.push({
        day: d.toISOString().slice(0, 10),
        ...totals(opus + haiku, 2 + (i % 4), 40000 + i * 1000),
        costByModel: {
          'claude-opus-5-5': opus,
          ...(haiku ? { 'claude-haiku-5-5': haiku } : {}),
        },
      });
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  const cost = days.reduce((s, x) => s + x.costUsd, 0);
  return {
    from,
    to,
    totals: totals(cost, 61, 1_250_000),
    byDay: days,
    byModel: [
      { model: 'claude-opus-5-5', ...totals(cost * 0.9, 50, 1_100_000) },
      { model: 'claude-haiku-5-5', ...totals(cost * 0.1, 11, 150_000) },
    ],
    byUser: [
      { userId: 2, userName: 'anthony', ...totals(cost * 0.7, 40, 900_000) },
      { userId: 3, userName: 'david', ...totals(cost * 0.3, 21, 350_000) },
    ],
    byProject: [
      {
        projectId: 9,
        projectTitle: 'Codex Xolotl',
        ...totals(cost * 0.8, 50, 1_000_000),
      },
      { projectId: 4, projectTitle: null, ...totals(cost * 0.2, 11, 250_000) },
    ],
  };
}

test('an admin sees the assistant usage in the admin panel', async ({
  page,
  context,
}) => {
  await mockLogin(context, page, { withTermsValidated: true });
  await mockAppRoutes(context);
  // Registered last, so it wins over mockLogin's profile.
  await context.route(`${BACKEND}/auth/profile`, (route) =>
    route.fulfill({ status: 200, json: admin }),
  );
  await context.route(`${BACKEND}/link-user-group/users`, (route) =>
    route.fulfill({ status: 200, json: [admin] }),
  );
  await context.route(`${BACKEND}/settings`, (route) =>
    route.fulfill({
      status: 200,
      json: { mutableSettings: [], unMutableSettings: [] },
    }),
  );
  const asked: string[] = [];
  await context.route(`${ASSISTANT}/**`, (route) => {
    const req = route.request();
    const cors = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'Authorization, Content-Type',
    };
    if (req.method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers: cors });
    const url = new URL(req.url());
    if (url.pathname === '/assistant/admin/usage') {
      asked.push(url.search);
      return route.fulfill({
        status: 200,
        headers: cors,
        json: summary(
          url.searchParams.get('from')!,
          url.searchParams.get('to')!,
        ),
      });
    }
    if (url.pathname === '/assistant/admin/feedback') {
      return route.fulfill({
        status: 200,
        headers: cors,
        json: {
          from: url.searchParams.get('from'),
          to: url.searchParams.get('to'),
          up: 4,
          down: 1,
          items: [
            {
              runId: 'r1',
              rating: 'down',
              comment: 'It read the date as 1343.',
              userId: 3,
              userName: 'david',
              projectId: 12,
              projectTitle: 'Book of hours',
              model: 'claude-opus-5-5',
              createdAt: '2026-11-20T10:00:00Z',
            },
          ],
        },
      });
    }
    return route.fulfill({ status: 404, headers: cors, json: {} });
  });

  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.goto('/app/my-projects');
  await page.getByRole('button', { name: /^admin$/i }).click();

  const dashboard = page.getByTestId('assistant-usage-dashboard');
  await expect(dashboard).toBeVisible();
  // Names come with their id; a project without a kept title shows its id.
  await expect(dashboard.getByText('Codex Xolotl (#9)')).toBeVisible();
  await expect(dashboard.getByText('#4', { exact: true })).toBeVisible();
  await expect(dashboard.getByTestId('cost-bar').first()).toBeVisible();
  // Feedback on answers, for the same period.
  const feedback = dashboard.getByRole('table', {
    name: /feedback on answers/i,
  });
  await expect(feedback).toContainText('It read the date as 1343.');
  await expect(feedback).toContainText('david (#3)');
  await dashboard.getByTestId('cost-chart').scrollIntoViewIfNeeded();
  await dashboard.getByTestId('cost-bar').nth(3).hover();
  await expect(dashboard.getByTestId('cost-chart-detail')).toContainText('$');
  if (process.env.USAGE_SCREENSHOT) {
    await dashboard.screenshot({ path: process.env.USAGE_SCREENSHOT });
  }

  await dashboard.getByRole('button', { name: /last 30 days/i }).click();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 29);
  await expect
    .poll(() => asked.at(-1))
    .toContain(`from=${from.toISOString().slice(0, 10)}`);

  const download = page.waitForEvent('download');
  await dashboard.getByRole('button', { name: /export csv/i }).click();
  expect((await download).suggestedFilename()).toMatch(
    /^assistant-usage-\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}\.csv$/,
  );
});
