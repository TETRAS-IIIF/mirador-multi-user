import { expect, test } from '@playwright/test';

// Mock data
const mockUser = {
  id: 123,
  mail: 'test@example.com',
  name: 'Test User',
  userGroups: [],
  _isAdmin: false,
  isEmailConfirmed: true,
  lastConnectedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  preferredLanguage: 'en',
  termsValidatedAt: null,
  loginCounter: 1,
};

const mockUserWithTerms = {
  ...mockUser,
  termsValidatedAt: new Date().toISOString(),
};

// ✅ Projects returned as ARRAY directly (based on getUserAllProjects)
const mockProjects = [
  {
    id: 1,
    title: 'Mon Premier Projet',
    description: 'Description du projet',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ownerId: 123,
    metadata: {},
    shared: false,
    rights: 'WRITE',
  },
  {
    id: 2,
    title: 'Deuxième Projet',
    description: 'Autre description',
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
    ownerId: 123,
    metadata: {},
    shared: false,
    rights: 'WRITE',
  },
];

// ✅ Manifests returned as ARRAY directly (based on getAllManifestGroups)
const mockManifests = [
  {
    id: 1,
    title: 'Sample Manifest',
    description: 'A sample IIIF manifest',
    hash: 'abc123def456',
    idCreator: 123,
    origin: 'UPLOAD',
    path: '/manifests/sample.json',
    url: 'https://example.com/iiif/manifest.json',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    thumbnailUrl: 'https://example.com/thumbnails/manifest.jpg',
    metadata: {
      author: 'Test Author',
      label: 'Sample Manuscript',
    },
  },
];

const mockPersonalGroup = {
  id: 456,
  name: 'Personal Group',
  description: 'Personal workspace',
  ownerId: 123,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

const mockMedia = [
  {
    id: 1,
    name: 'test-image.jpg',
    path: '/media/test-image.jpg',
    type: 'image/jpeg',
    size: 12345,
    userId: 123,
    created_at: '2024-01-01T00:00:00.000Z',
  },
];

test.describe('My Projects - With Terms Validation', () => {
  test('should complete full flow: login → terms validation → my projects', async ({
    page,
    context,
  }) => {
    const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const routesCalled = new Set<string>();

    let profileCallCount = 0;

    await context.route(`${backendUrl}/auth/profile`, async (route) => {
      profileCallCount++;
      routesCalled.add('profile');

      if (profileCallCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockUser),
        });
      } else {
        console.log(
          '✅ Profile route intercepted - termsValidatedAt: has date',
        );
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockUserWithTerms),
        });
      }
    });

    await context.route(`${backendUrl}/auth/valid-terms`, async (route) => {
      if (route.request().method() === 'PATCH') {
        routesCalled.add('validTerms');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Terms validated successfully',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await context.route(
      `${backendUrl}/link-group-project/user/projects/${mockUser.id}`,
      async (route) => {
        routesCalled.add('projects');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockProjects),
        });
      },
    );

    await context.route(
      `${backendUrl}/link-user-group/user-personal-group/${mockUser.id}`,
      async (route) => {
        routesCalled.add('personalGroup');
        console.log(
          '✅ Personal group route intercepted:',
          route.request().url(),
        );
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPersonalGroup),
        });
      },
    );

    await context.route(
      `${backendUrl}/link-manifest-group/manifests`,
      async (route) => {
        routesCalled.add('manifests');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockManifests),
        });
      },
    );

    await context.route('**/link-user-group/groups/**', async (route) => {
      routesCalled.add('groups');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await context.route('**/media/user/**', async (route) => {
      routesCalled.add('media');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockMedia),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem(
        'Mirador-multi-user-token',
        JSON.stringify('mock-token-12345'),
      );
    });

    await page.goto('/app/my-projects', { waitUntil: 'networkidle' });

    await page.waitForTimeout(5000);

    await expect(
      page.getByRole('heading', { name: /validate terms of use/i }),
    ).toBeVisible();

    const checkbox = page.getByRole('checkbox', {
      name: /Please accept the terms of use/i,
    });
    await checkbox.check();

    const validateButton = page.getByRole('button', { name: /validate/i });
    await validateButton.click();

    await page.waitForTimeout(10000);

    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText('Mon Premier Projet', { exact: true }),
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test('should directly access my-projects page when terms already validated', async ({
    page,
    context,
  }) => {
    const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const routesCalled = new Set<string>();

    await context.route(`${backendUrl}/auth/profile`, async (route) => {
      routesCalled.add('profile');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUserWithTerms), // ✅ termsValidatedAt: has date
      });
    });

    await context.route(
      `${backendUrl}/link-group-project/user/projects/${mockUser.id}`,
      async (route) => {
        routesCalled.add('projects');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockProjects),
        });
      },
    );

    await context.route(
      `${backendUrl}/link-user-group/user-personal-group/${mockUser.id}`,
      async (route) => {
        routesCalled.add('personalGroup');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPersonalGroup),
        });
      },
    );

    await context.route(
      `${backendUrl}/link-manifest-group/manifests`,
      async (route) => {
        routesCalled.add('manifests');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockManifests),
        });
      },
    );

    await context.route('**/link-user-group/groups/**', async (route) => {
      routesCalled.add('groups');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await context.route('**/media/user/**', async (route) => {
      routesCalled.add('media');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockMedia),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem(
        'Mirador-multi-user-token',
        JSON.stringify('mock-token-12345'),
      );
    });

    await page.goto('/app/my-projects', { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('heading', { name: /validate terms of use/i }),
    ).not.toBeVisible();

    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText('Mon Premier Projet', { exact: true }),
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test('should show terms validation when termsValidatedAt is null', async ({
    page,
    context,
  }) => {
    const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3000';

    await context.route(`${backendUrl}/auth/profile`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem(
        'Mirador-multi-user-token',
        JSON.stringify('mock-token-12345'),
      );
    });

    await page.goto('/app/my-projects', { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('heading', { name: /validate terms of use/i }),
    ).toBeVisible();

    await expect(
      page.getByText('Mon Premier Projet', { exact: true }),
    ).not.toBeVisible();
  });
});
