import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/gettingAnnotationPage.ts', () => ({
  gettingAnnotationPage: vi.fn(),
}));
vi.mock('../api/deleteAnnotationPage.ts', () => ({
  deleteAnnotationPage: vi.fn(),
}));
vi.mock('../api/annotationApi.ts', async () => {
  const actual = await vi.importActual('../api/annotationApi.ts');
  return {
    AnnotationApiError: actual.AnnotationApiError,
    acceptAnnotation: vi.fn(),
    acceptAnnotations: vi.fn(),
    createAnnotation: vi.fn(),
    deleteAnnotation: vi.fn(),
    deleteAnnotations: vi.fn(),
    updateAnnotation: vi.fn(),
  };
});

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn() },
}));
vi.mock('i18next', () => ({ t: (key) => key }));

import MMUAdapter from './MMUAdapter';
import toast from 'react-hot-toast';
import { gettingAnnotationPage } from '../api/gettingAnnotationPage.ts';
import * as api from '../api/annotationApi.ts';

const PAGE_ID = 'https://example.org/canvas/1/annotationPage';
const page = (items) => ({ id: PAGE_ID, type: 'AnnotationPage', items });

describe('MMUAdapter', () => {
  let showDrafts;
  let adapter;

  beforeEach(() => {
    vi.clearAllMocks();
    showDrafts = false;
    adapter = new MMUAdapter(7, PAGE_ID, 'alice', {
      showDrafts: () => showDrafts,
    });
    gettingAnnotationPage.mockResolvedValue([
      { content: page([{ id: 'a1' }]) },
    ]);
  });

  it('create() posts only the new annotation and returns the page', async () => {
    const result = await adapter.create({ id: 'a2' });
    expect(api.createAnnotation).toHaveBeenCalledWith({
      projectId: 7,
      annotationPageId: PAGE_ID,
      content: { id: 'a2' },
    });
    expect(result).toEqual(page([{ id: 'a1' }]));
  });

  it('update() publishes, unless the annotation is still marked as a draft', async () => {
    await adapter.update({ id: 'a1', body: [] });
    expect(api.updateAnnotation).toHaveBeenLastCalledWith(7, 'a1', {
      content: { id: 'a1', body: [] },
      status: 'published',
    });
    await adapter.update({ id: 'd1', 'mmu:status': 'draft' });
    expect(api.updateAnnotation).toHaveBeenLastCalledWith(7, 'd1', {
      content: { id: 'd1', 'mmu:status': 'draft' },
      status: undefined,
    });
  });

  it('delete() ignores 404 (annotation on another canvas)', async () => {
    api.deleteAnnotation.mockRejectedValueOnce(
      new api.AnnotationApiError(404, 'not found'),
    );
    await expect(adapter.delete('elsewhere')).resolves.toEqual(
      page([{ id: 'a1' }]),
    );
    api.deleteAnnotation.mockRejectedValueOnce(
      new api.AnnotationApiError(500, 'boom'),
    );
    await expect(adapter.delete('a1')).rejects.toThrow('boom');
  });

  it('all() asks for drafts only when the switch is on', async () => {
    await adapter.all();
    expect(gettingAnnotationPage).toHaveBeenLastCalledWith(PAGE_ID, 7, false);
    showDrafts = true;
    await adapter.all();
    expect(gettingAnnotationPage).toHaveBeenLastCalledWith(PAGE_ID, 7, true);
  });

  it('all() returns an empty page when the canvas has none', async () => {
    gettingAnnotationPage.mockResolvedValueOnce([]);
    await expect(adapter.all()).resolves.toEqual(page([]));
  });

  it('accept/acceptAll/rejectAll target this canvas', async () => {
    await adapter.accept('d1');
    expect(api.acceptAnnotation).toHaveBeenCalledWith(7, 'd1');
    await adapter.acceptAll();
    expect(api.acceptAnnotations).toHaveBeenCalledWith({
      annotationPageId: PAGE_ID,
      projectId: 7,
    });
    await adapter.rejectAll();
    expect(api.deleteAnnotations).toHaveBeenCalledWith({
      annotationPageId: PAGE_ID,
      projectId: 7,
      status: 'draft',
    });
  });

  it('sends back the version it loaded, then the one the save returned', async () => {
    const adapter9 = new MMUAdapter(9, PAGE_ID, 'alice');
    gettingAnnotationPage.mockResolvedValue([
      { content: page([{ id: 'v1', 'mmu:version': '3' }]) },
    ]);
    await adapter9.all();
    api.updateAnnotation.mockResolvedValueOnce({
      content: { id: 'v1', 'mmu:version': '4' },
    });
    // After the save, the server serves the new version.
    gettingAnnotationPage.mockResolvedValue([
      { content: page([{ id: 'v1', 'mmu:version': '4' }]) },
    ]);
    // The editor may drop unknown fields: the adapter remembers the version.
    await adapter9.update({ id: 'v1', body: [] });
    expect(api.updateAnnotation).toHaveBeenLastCalledWith(9, 'v1', {
      content: { id: 'v1', body: [] },
      status: 'published',
      expectedVersion: '3',
    });
    // A new adapter (Mirador makes one per call) uses the saved version.
    await new MMUAdapter(9, PAGE_ID, 'alice').update({ id: 'v1', body: [] });
    expect(api.updateAnnotation.mock.lastCall[2].expectedVersion).toBe('4');
    // The annotation's own version wins when it has one.
    await adapter9.update({ id: 'v1', 'mmu:version': '7' });
    expect(api.updateAnnotation.mock.lastCall[2].expectedVersion).toBe('7');
  });

  it('says so, and keeps the editor open, when someone else saved meanwhile', async () => {
    api.updateAnnotation.mockRejectedValueOnce(
      new api.AnnotationApiError(409, 'PATCH failed (409)'),
    );
    await expect(
      adapter.update({ id: 'a1', 'mmu:version': '2' }),
    ).rejects.toBeInstanceOf(api.AnnotationApiError);
    expect(toast.error).toHaveBeenCalledWith('annotationConflict', {
      duration: 10000,
    });
    // Other errors: no conflict message.
    api.updateAnnotation.mockRejectedValueOnce(new Error('network'));
    await expect(adapter.update({ id: 'a1' })).rejects.toThrow('network');
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
