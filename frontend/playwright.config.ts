import { defineConfig, devices } from '@playwright/test';

const TEST_MODE = process.env.TEST_MODE || 'light';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4000';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 200_000,
  expect: {
    timeout: 200_000,
  },
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    process.env.CI ? ['github' as const] : ['list' as const],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  use: {
    baseURL,
    video: process.env.CI ? 'off' : 'retain-on-failure',
    trace: process.env.CI ? 'on-first-retry' : 'on',
    screenshot: 'only-on-failure',
    navigationTimeout: 150000,
    actionTimeout: 100000,
  },

  projects:
    TEST_MODE === 'full'
      ? [
          {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
          },
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
          },
        ]
      : [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
        ],
});
