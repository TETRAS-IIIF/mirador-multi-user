import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('mirador', () => ({
  getConfig: (state: { config: object }) => state.config,
  getVisibleCanvasIds: () => ['c1'],
  receiveAnnotation: (canvasId: string, pageId: string, json: unknown) => ({
    type: 'RECEIVE_ANNOTATION',
    canvasId,
    pageId,
    json,
  }),
}));
vi.mock('../api/gettingAnnotationPage.ts', () => ({
  gettingAnnotationPage: vi.fn(),
}));

import { gettingAnnotationPage } from '../api/gettingAnnotationPage.ts';
import {
  isEditing,
  LIVE_REFRESH_MS,
  liveRefreshPlugin,
  pageFingerprint,
  refreshChanged,
} from './liveRefreshPlugin.tsx';

const page = (...ids: string[]) => ({
  id: 'c1/annotationPage',
  type: 'AnnotationPage',
  items: ids.map((id) => ({ id })),
});
const served = (json: object) =>
  vi.mocked(gettingAnnotationPage).mockResolvedValue([{ content: json }]);

describe('live refresh', () => {
  beforeEach(() => vi.clearAllMocks());

  it('tells pages apart by their annotations', () => {
    expect(pageFingerprint(page('a'))).toBe(pageFingerprint(page('a')));
    expect(pageFingerprint(page('a'))).not.toBe(
      pageFingerprint(page('a', 'b')),
    );
    expect(pageFingerprint(undefined)).toBe(pageFingerprint({ items: [] }));
  });

  it('knows when an annotation editor is open in the window', () => {
    const state = {
      windows: { w1: { companionWindowIds: ['cw1'] }, w2: {} },
      companionWindows: { cw1: { content: 'annotationCreation' } },
    };
    expect(isEditing(state, 'w1')).toBe(true);
    expect(isEditing(state, 'w2')).toBe(false);
    state.companionWindows.cw1.content = 'annotations';
    expect(isEditing(state, 'w1')).toBe(false);
  });

  it('updates the viewer only when the page changed', async () => {
    const dispatch = vi.fn();
    served(page('a'));
    await refreshChanged(dispatch, 7, ['c1'], { c1: page('a') });
    expect(dispatch).not.toHaveBeenCalled();

    served(page('a', 'b'));
    await refreshChanged(dispatch, 7, ['c1'], { c1: page('a') });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        canvasId: 'c1',
        pageId: 'c1/annotationPage',
        json: page('a', 'b'),
      }),
    );
  });

  describe('the plugin', () => {
    const LiveRefresh = liveRefreshPlugin.component;
    const props = {
      projectId: 7,
      canvasIds: ['c1'],
      editing: false,
      pages: { c1: page('a') },
    };

    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    const tick = () =>
      act(async () => {
        await vi.advanceTimersByTimeAsync(LIVE_REFRESH_MS);
      });

    it('polls the visible canvases and applies what others saved', async () => {
      const dispatch = vi.fn();
      served(page('a', 'b'));
      render(<LiveRefresh {...props} dispatch={dispatch} />);
      expect(gettingAnnotationPage).not.toHaveBeenCalled();
      await tick();
      expect(gettingAnnotationPage).toHaveBeenCalledWith(
        'c1/annotationPage',
        7,
        expect.any(Boolean),
      );
      expect(dispatch).toHaveBeenCalledTimes(1);
    });

    it('pauses while an annotation is edited', async () => {
      const dispatch = vi.fn();
      served(page('a', 'b'));
      const view = render(
        <LiveRefresh {...props} editing dispatch={dispatch} />,
      );
      await tick();
      expect(gettingAnnotationPage).not.toHaveBeenCalled();
      // Editor closed: next tick refreshes, without restarting the timer.
      view.rerender(<LiveRefresh {...props} dispatch={dispatch} />);
      await tick();
      expect(dispatch).toHaveBeenCalledTimes(1);
    });

    it('does nothing while the tab is hidden, or without a project', async () => {
      const dispatch = vi.fn();
      const visibility = vi
        .spyOn(document, 'visibilityState', 'get')
        .mockReturnValue('hidden');
      render(<LiveRefresh {...props} dispatch={dispatch} />);
      await tick();
      expect(gettingAnnotationPage).not.toHaveBeenCalled();
      visibility.mockRestore();

      render(<LiveRefresh {...props} projectId={0} dispatch={dispatch} />);
      await tick();
      // Only the first plugin (now visible) polled.
      expect(gettingAnnotationPage).toHaveBeenCalledTimes(1);
    });

    it('stops polling when unmounted', async () => {
      const dispatch = vi.fn();
      served(page('a'));
      const view = render(<LiveRefresh {...props} dispatch={dispatch} />);
      view.unmount();
      await tick();
      expect(gettingAnnotationPage).not.toHaveBeenCalled();
    });
  });
});
