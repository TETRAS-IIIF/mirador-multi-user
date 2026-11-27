import { expect, test, type APIRequestContext } from '@playwright/test';
import { deflateSync } from 'node:zlib';

/**
 * Live refresh, against the real local MMU stack (backend, database, Mirador,
 * MAEV): an annotation someone else saves on the canvas being viewed shows
 * up without reloading the page.
 *
 * Needs: `just up`, migrations run, and an account:
 *   E2E_USER_MAIL / E2E_USER_PASSWORD (default claude@tetras-libre.fr / claudeclaude)
 * Skipped when E2E_REAL_BACKEND is not set, as the other e2e tests mock MMU.
 */
const BACKEND = process.env.VITE_BACKEND_URL || 'http://localhost:3000';
const MAIL = process.env.E2E_USER_MAIL || 'claude@tetras-libre.fr';
const PASSWORD = process.env.E2E_USER_PASSWORD || 'claudeclaude';

const HOST = 'https://e2e-live.mmu.test';
const MANIFEST = `${HOST}/manifest.json`;
const CANVAS = `${HOST}/canvas/1`;
const PAGE_ID = `${CANVAS}/annotationPage`;

test.skip(
  !process.env.E2E_REAL_BACKEND,
  'Needs the real local MMU stack (E2E_REAL_BACKEND=1)',
);

/** A plain grey PNG, so Mirador has a real image to show. */
function png(width: number, height: number): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // greyscale
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width, 200)]);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const manifest = {
  '@context': 'http://iiif.io/api/presentation/3/context.json',
  id: MANIFEST,
  type: 'Manifest',
  label: { en: ['E2E book of hours'] },
  items: [
    {
      id: CANVAS,
      type: 'Canvas',
      label: { en: ['folio 12'] },
      width: 400,
      height: 600,
      items: [
        {
          id: `${CANVAS}/page`,
          type: 'AnnotationPage',
          items: [
            {
              id: `${CANVAS}/painting`,
              type: 'Annotation',
              motivation: 'painting',
              target: CANVAS,
              body: {
                id: `${HOST}/page.png`,
                type: 'Image',
                format: 'image/png',
                width: 400,
                height: 600,
              },
            },
          ],
        },
      ],
    },
  ],
};

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'Authorization, Content-Type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
};

async function login(request: APIRequestContext) {
  const res = await request.post(`${BACKEND}/auth/login`, {
    data: { mail: MAIL, password: PASSWORD },
  });
  expect(res.ok(), 'login with the e2e account').toBeTruthy();
  const { access_token: token } = await res.json();
  const auth = { Authorization: `Bearer ${token}` };
  const profile = await (
    await request.get(`${BACKEND}/auth/profile`, { headers: auth })
  ).json();
  return { token, auth, userId: profile.id as number };
}

test('an annotation saved by someone else appears in the open viewer', async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(90000);
  const { token, auth, userId } = await login(request);
  const title = `E2E live refresh ${Date.now()}`;
  const created = await request.post(`${BACKEND}/link-group-project/project/`, {
    headers: auth,
    data: { title, ownerId: userId, metadata: {} },
  });
  expect(created.ok()).toBeTruthy();
  const projectId: number = (await created.json()).project.id;

  await context.route(`${HOST}/**`, async (route) => {
    const url = route.request().url();
    if (url === MANIFEST) {
      return route.fulfill({
        status: 200,
        headers: cors,
        contentType: 'application/json',
        body: JSON.stringify(manifest),
      });
    }
    if (url.endsWith('/page.png')) {
      return route.fulfill({
        status: 200,
        headers: cors,
        contentType: 'image/png',
        body: png(400, 600),
      });
    }
    return route.fulfill({ status: 404, headers: cors, body: '' });
  });

  await page.addInitScript((value) => {
    localStorage.setItem('Mirador-multi-user-token', JSON.stringify(value));
  }, token);
  await page.goto('/app/my-projects');
  const terms = page.getByRole('button', { name: /validate terms of use/i });
  const projectLink = page.getByText(title, { exact: true });
  await expect(terms.or(projectLink)).toBeVisible();
  if (await terms.isVisible()) {
    await page.getByRole('checkbox').check();
    await terms.click();
  }
  await page.getByLabel(/filter projects/i).fill(title);
  await expect(page.getByText(title, { exact: true })).toHaveCount(1);
  await page
    .getByRole('button', { name: /open project/i })
    .first()
    .click();
  const addResource = page.getByRole('button', { name: /add resource/i });
  const startHere = page.getByRole('button', { name: /start here/i });
  await expect(addResource.or(startHere).first()).toBeVisible();
  if (await startHere.isVisible()) await startHere.click();
  await addResource.click();
  await page.getByLabel(/resource location/i).fill(MANIFEST);
  await page.getByRole('button', { name: /^add$/i }).click();
  await page.getByText('E2E book of hours').first().click();
  await expect(page.locator('.openseadragon-canvas').first()).toBeVisible();
  // The window's annotation list.
  await page
    .getByRole('button', { name: /show sidebar/i })
    .first()
    .click();
  await page
    .getByRole('tab', { name: /annotations/i })
    .first()
    .click();
  const text = `Saved elsewhere ${Date.now()}`;
  await expect(page.getByText(text)).toHaveCount(0);

  // Someone else (same API, another client) saves an annotation on the canvas.
  const response = await request.post(`${BACKEND}/annotation`, {
    headers: auth,
    data: {
      projectId,
      annotationPageId: PAGE_ID,
      content: {
        id: `${CANVAS}/annotation/live-${Date.now()}`,
        type: 'Annotation',
        motivation: 'commenting',
        body: [
          {
            type: 'TextualBody',
            purpose: 'describing',
            format: 'text/html',
            value: `<p>${text}</p>`,
          },
        ],
        target: `${CANVAS}#xywh=10,10,50,50`,
      },
    },
  });
  expect(response.status()).toBe(201);

  // No reload: the viewer picks it up on its next poll (every 15 s).
  await expect(page.getByText(text).first()).toBeVisible({ timeout: 30000 });
});
