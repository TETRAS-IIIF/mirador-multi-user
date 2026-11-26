import { expect, test, type APIRequestContext } from '@playwright/test';
import { deflateSync } from 'node:zlib';

/**
 * Assistant end to end, against the real local MMU stack (backend, database,
 * Mirador, MAEV). Only the AI stack is replaced: requests to
 * VITE_ASSISTANT_URL are answered here, and the "AI" writes a real draft
 * through MMU's API with the user's token, as mmu-agents-backend does.
 *
 * Needs: `just up` with ASSISTANT_URL set (the frontend must be built or
 * served with VITE_ASSISTANT_URL), migrations run, and an account:
 *   E2E_USER_MAIL / E2E_USER_PASSWORD (default claude@tetras-libre.fr / claudeclaude)
 * Skipped when E2E_REAL_BACKEND is not set, as the other e2e tests mock MMU.
 */
const BACKEND = process.env.VITE_BACKEND_URL || 'http://localhost:3000';
const ASSISTANT = (
  process.env.VITE_ASSISTANT_URL || 'http://localhost:3100'
).replace(/\/+$/, '');
const MAIL = process.env.E2E_USER_MAIL || 'claude@tetras-libre.fr';
const PASSWORD = process.env.E2E_USER_PASSWORD || 'claudeclaude';

const HOST = 'https://e2e-iiif.mmu.test';
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

test('ask the assistant, then accept its draft in the annotation list', async ({
  page,
  context,
  request,
}) => {
  const { token, auth, userId } = await login(request);
  const title = `E2E assistant ${Date.now()}`;
  const created = await request.post(`${BACKEND}/link-group-project/project/`, {
    headers: auth,
    data: { title, ownerId: userId, metadata: {} },
  });
  expect(created.ok()).toBeTruthy();
  const projectId: number = (await created.json()).project.id;

  // IIIF resources served by the test.
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

  // The AI stack, faked.
  let draftId = '';
  let chatBody: unknown = null;
  await context.route(`${ASSISTANT}/**`, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers: cors });
    const url = new URL(req.url());
    if (url.pathname === '/assistant/history') {
      return route.fulfill({
        status: 200,
        headers: cors,
        contentType: 'application/json',
        body: '{"messages":[]}',
      });
    }
    if (url.pathname === '/assistant/chat') {
      chatBody = req.postDataJSON();
      expect(req.headers().authorization).toBe(`Bearer ${token}`);
      // What mmu-agents-backend does: write a draft with the user's token.
      const draft = await request.post(`${BACKEND}/annotation`, {
        headers: { ...auth, 'x-mmu-client': 'assistant' },
        data: {
          projectId,
          annotationPageId: PAGE_ID,
          model: 'claude-opus-5-5',
          content: {
            id: `${CANVAS}/annotation/e2e-${Date.now()}`,
            type: 'Annotation',
            motivation: 'commenting',
            body: [
              {
                type: 'TextualBody',
                purpose: 'describing',
                format: 'text/html',
                value: '<p>anno domini MCCCXLII</p>',
              },
              { type: 'TextualBody', purpose: 'tagging', value: 'date' },
            ],
            target: {
              source: CANVAS,
              selector: {
                type: 'FragmentSelector',
                conformsTo: 'http://www.w3.org/TR/media-frags/',
                value: 'xywh=50,100,200,40',
              },
            },
          },
        },
      });
      expect(draft.status()).toBe(201);
      const row = await draft.json();
      draftId = row.id;
      const events = [
        {
          type: 'run',
          runId: 'e2e-run',
          conversationId: 1,
          model: 'claude-opus-5-5',
        },
        // Enough steps to overflow the panel's message list.
        ...Array.from({ length: 40 }, (_, i) => ({
          type: 'step',
          id: `s${i}`,
          label: `Looking at the page, part ${i + 1}`,
          status: 'done',
        })),
        {
          type: 'draft',
          annotationId: row.id,
          annotationPageId: PAGE_ID,
          canvasId: CANVAS,
          batchId: null,
          annotation: row.content,
          cropUrl: null,
        },
        { type: 'text', delta: 'I found one date, on line 15.' },
        { type: 'done', stopReason: 'end_turn' },
      ];
      return route.fulfill({
        status: 200,
        headers: { ...cors, 'content-type': 'text/event-stream' },
        body: events
          .map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`)
          .join(''),
      });
    }
    return route.fulfill({ status: 404, headers: cors, body: '{}' });
  });

  await page.addInitScript((value) => {
    localStorage.setItem('Mirador-multi-user-token', JSON.stringify(value));
  }, token);

  // Open the project and add the manifest with Mirador's own "add resource".
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

  // Ask the assistant.
  await page.getByRole('button', { name: /open the assistant/i }).click();
  const panel = page.getByTestId('assistant-panel');

  // Ask about a region: drag a rectangle on the image.
  await panel.getByRole('button', { name: /ask about a region/i }).click();
  const image = (await page
    .locator('.openseadragon-canvas')
    .first()
    .boundingBox())!;
  const cx = image.x + image.width / 2;
  const cy = image.y + image.height / 2;
  await page.mouse.move(cx - 60, cy - 40);
  await page.mouse.down();
  await page.mouse.move(cx + 40, cy + 30, { steps: 8 });
  await page.mouse.up();
  await expect(panel.getByTestId('assistant-region')).toBeVisible();
  // The outline is drawn where the user dragged.
  const outline = (await page.locator('#mmu-assistant-region').boundingBox())!;
  expect(Math.abs(outline.x - (cx - 60))).toBeLessThan(3);
  expect(Math.abs(outline.width - 100)).toBeLessThan(4);
  await panel
    .getByLabel(/ask the assistant/i)
    .fill('find the date and annotate it');
  await panel.getByRole('button', { name: /send/i }).click();

  await expect(panel.getByText('I found one date, on line 15.')).toBeVisible();
  await expect(panel.getByTestId('draft-card')).toContainText(
    'anno domini MCCCXLII',
  );
  // The panel keeps the window height: only its message list scrolls.
  const sizes = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="assistant-panel"]')!;
    const list = document.querySelector(
      '[data-testid="assistant-messages"]',
    ) as HTMLElement;
    return {
      panelBottom: panel.getBoundingClientRect().bottom,
      viewport: window.innerHeight,
      page: document.documentElement.scrollHeight,
      listOverflows: list.scrollHeight > list.clientHeight,
      listAtBottom: list.scrollTop + list.clientHeight >= list.scrollHeight - 2,
    };
  });
  expect(sizes.listOverflows, 'the conversation overflows the list').toBe(true);
  expect(sizes.listAtBottom, 'the list is scrolled to the end').toBe(true);
  expect(sizes.panelBottom).toBeLessThanOrEqual(sizes.viewport);
  expect(sizes.page).toBeLessThanOrEqual(sizes.viewport);
  expect(chatBody).toMatchObject({
    message: 'find the date and annotate it',
    context: {
      projectId,
      manifestId: MANIFEST,
      canvasId: CANVAS,
      // In canvas pixels, inside the 400x600 canvas.
      region: {
        x: expect.any(Number),
        y: expect.any(Number),
        w: expect.any(Number),
        h: expect.any(Number),
      },
    },
  });

  // The window shows a draft counter; it opens the annotation list.
  const counter = page.getByTestId('draft-counter');
  await expect(counter).toBeVisible();
  await expect(counter).toContainText('1');
  await counter.click();

  // MAEV: badge and Accept on the draft.
  const draftActions = page.getByTestId('draft-actions');
  await expect(draftActions).toBeVisible();
  await expect(draftActions).toContainText(/draft/i);
  await draftActions.getByRole('button', { name: /^accept$/i }).click();
  await expect(draftActions).toHaveCount(0);

  // Published, with provenance.
  const published = await request.get(
    `${BACKEND}/annotation/${projectId}/${encodeURIComponent(draftId)}`,
    { headers: auth },
  );
  const row = await published.json();
  expect(row.status).toBe('published');
  expect(row.acceptedById).toBe(userId);
  expect(row.content.generator).toEqual({
    type: 'Software',
    name: 'claude-opus-5-5',
  });
  await expect(counter).toHaveCount(0);
});
