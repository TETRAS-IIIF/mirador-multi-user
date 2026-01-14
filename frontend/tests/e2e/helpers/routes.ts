// tests/helpers/routes.ts
import { BrowserContext } from '@playwright/test';
import {
  mockProjects,
  mockPersonalGroup,
  mockManifests,
  mockMedia,
  mockUser,
} from './data';

export async function mockAppRoutes(context: BrowserContext) {
  const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3000';

  await context.route(
    `${backendUrl}/link-group-project/user/projects/${mockUser.id}`,
    async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProjects),
      }),
  );

  await context.route(
    `${backendUrl}/link-user-group/user-personal-group/${mockUser.id}`,
    async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPersonalGroup),
      }),
  );

  await context.route(
    `${backendUrl}/link-manifest-group/manifests`,
    async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockManifests),
      }),
  );

  await context.route('**/link-user-group/groups/**', async (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );

  await context.route('**/media/user/**', async (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockMedia),
    }),
  );
}
