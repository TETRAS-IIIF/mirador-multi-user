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

import MMUAdapter from './MMUAdapter';
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
});
