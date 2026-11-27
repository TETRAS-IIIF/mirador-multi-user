import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createSseParser } from './sse.ts';
import {
  getShowDrafts,
  setShowDrafts,
  subscribeShowDrafts,
} from './draftsState.ts';

vi.mock('mirador', () => ({
  addCompanionWindow: (windowId: string, payload: unknown) => ({
    type: 'ADD_CW',
    windowId,
    payload,
  }),
  hoverAnnotation: (windowId: string, ids: string[]) => ({
    type: 'HOVER',
    windowId,
    ids,
  }),
  receiveAnnotation: (targetId: string, id: string, json: unknown) => ({
    type: 'RECEIVE',
    targetId,
    id,
    json,
  }),
  setCanvas: (windowId: string, canvasId: string) => ({
    type: 'SET_CANVAS',
    windowId,
    canvasId,
  }),
  OSDReferences: { get: () => undefined },
}));

vi.mock('../mirador/api/gettingAnnotationPage.ts', () => ({
  gettingAnnotationPage: vi.fn(async () => [
    { content: { id: 'p', type: 'AnnotationPage', items: [] } },
  ]),
}));
vi.mock('../mirador/api/annotationApi.ts', async () => {
  const actual = await vi.importActual<object>(
    '../mirador/api/annotationApi.ts',
  );
  return {
    ...actual,
    acceptAnnotation: vi.fn(async () => ({})),
    deleteAnnotation: vi.fn(async () => ({})),
  };
});
vi.mock('./api.ts', async () => {
  const actual = await vi.importActual<object>('./api.ts');
  return {
    ...actual,
    streamChat: vi.fn(),
    getHistory: vi.fn(async () => ({ messages: [] })),
    answerViewer: vi.fn(async () => ({})),
    answerConfirm: vi.fn(async () => ({})),
    stopRun: vi.fn(async () => ({})),
    resetHistory: vi.fn(async () => ({})),
    addNote: vi.fn(async () => ({})),
    getMyUsage: vi.fn(async () => null),
    getModels: vi.fn(async () => null),
  };
});

import * as api from './api.ts';
import * as annotationApi from '../mirador/api/annotationApi.ts';
import * as mirador from 'mirador';
import {
  activeWindow,
  runViewerAction,
  viewerContext,
  regionFromPoints,
  selectRegion,
} from './viewerBridge.ts';
import { AssistantPanel } from './components/AssistantPanel.tsx';

const CANVAS = 'https://example.org/canvas/1';

function fakeViewer() {
  const dispatched: Record<string, unknown>[] = [];
  return {
    dispatched,
    store: {
      dispatch: (a: unknown) => dispatched.push(a as Record<string, unknown>),
      getState: () => ({
        windows: {
          w1: {
            manifestId: 'https://example.org/m.json',
            canvasId: CANVAS,
            selectedAnnotationId: 'sel/1',
          },
        },
        workspace: { windowIds: ['w1'], focusedWindowId: 'w1' },
      }),
    },
  };
}

describe('createSseParser', () => {
  it('parses events split across chunks and ignores comments', () => {
    const events: unknown[] = [];
    const parse = createSseParser((e) => events.push(e));
    parse(': ping\n\nevent: text\ndata: {"type":"te');
    parse('xt","delta":"hi"}\n\nevent: done\r\ndata: {"type":"done"}\r\n\r\n');
    expect(events).toEqual([{ type: 'text', delta: 'hi' }, { type: 'done' }]);
  });
});

/** In-memory Storage: Node 25+ has its own `localStorage` global, which hides jsdom's. */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

describe('draftsState', () => {
  beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()));
  afterEach(() => vi.unstubAllGlobals());
  it('defaults to showing drafts, per project, and notifies listeners', () => {
    expect(getShowDrafts(1)).toBe(true);
    const listener = vi.fn();
    const unsubscribe = subscribeShowDrafts(listener);
    setShowDrafts(1, false);
    expect(getShowDrafts(1)).toBe(false);
    expect(getShowDrafts(2)).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});

describe('viewerBridge', () => {
  it('reads the focused window', () => {
    const viewer = fakeViewer();
    expect(activeWindow(viewer)).toEqual({
      id: 'w1',
      manifestId: 'https://example.org/m.json',
      canvasId: CANVAS,
    });
    expect(viewerContext(viewer)).toEqual({
      manifestId: 'https://example.org/m.json',
      canvasId: CANVAS,
    });
    expect(viewerContext(undefined)).toEqual({});
  });

  it('runs viewer actions through Mirador actions', () => {
    const viewer = fakeViewer();
    expect(
      runViewerAction(viewer, 'open_canvas', { canvas_id: 'c2' }),
    ).toContain('Opened');
    expect(
      runViewerAction(viewer, 'highlight', { annotation_ids: ['a'] }),
    ).toBe('Highlighted.');
    expect(viewer.dispatched).toEqual([
      { type: 'SET_CANVAS', windowId: 'w1', canvasId: 'c2' },
      { type: 'HOVER', windowId: 'w1', ids: ['a'] },
    ]);
    // No OSD viewer in tests: zoom degrades to a message.
    expect(
      runViewerAction(viewer, 'zoom_to', {
        canvas_id: CANVAS,
        region: { x: 1, y: 1, w: 2, h: 2 },
      }),
    ).toContain('zoom is not available');
  });
});

describe('AssistantPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends the viewer context, streams the answer and shows a draft card', async () => {
    const viewer = fakeViewer();
    vi.mocked(api.streamChat).mockImplementation(async (_body, onEvent) => {
      onEvent({
        type: 'run',
        runId: 'r1',
        conversationId: 1,
        model: 'claude-opus-5-5',
      });
      onEvent({
        type: 'step',
        id: 's1',
        label: 'Looking at the page',
        status: 'running',
      });
      onEvent({
        type: 'step',
        id: 's1',
        label: 'Looking at the page',
        status: 'done',
      });
      onEvent({
        type: 'draft',
        annotationId: 'd1',
        annotationPageId: `${CANVAS}/annotationPage`,
        canvasId: CANVAS,
        batchId: 4,
        annotation: {
          body: [
            { purpose: 'describing', value: '<p>anno domini</p>' },
            { purpose: 'tagging', value: 'date' },
          ],
        },
        cropUrl: null,
      });
      onEvent({
        type: 'viewer',
        callId: 'v1',
        action: 'open_canvas',
        args: { canvas_id: CANVAS },
      });
      onEvent({ type: 'text', delta: 'I found ' });
      onEvent({ type: 'text', delta: 'one date.' });
      onEvent({ type: 'suggestions', actions: ['Do the same on folio 13'] });
      onEvent({ type: 'done', stopReason: 'end_turn' });
    });

    render(
      <AssistantPanel
        projectId={7}
        viewer={viewer}
        language="fr"
        onClose={() => undefined}
      />,
    );
    fireEvent.change(screen.getByLabelText('assistant.placeholder'), {
      target: { value: 'find the date' },
    });
    fireEvent.click(screen.getByLabelText('assistant.send'));

    await screen.findByText('I found one date.');
    expect(vi.mocked(api.streamChat).mock.calls[0][0]).toEqual({
      message: 'find the date',
      mode: 'careful',
      context: {
        projectId: 7,
        manifestId: 'https://example.org/m.json',
        canvasId: CANVAS,
        annotationId: 'sel/1',
        language: 'fr',
      },
    });
    expect(screen.getByTestId('draft-card')).toHaveTextContent('anno domini');
    expect(screen.getByTestId('draft-card')).toHaveTextContent('date');
    expect(api.answerViewer).toHaveBeenCalledWith(
      'r1',
      'v1',
      expect.stringContaining('Opened'),
    );
    expect(screen.getByText('Do the same on folio 13')).toBeInTheDocument();
    // The canvas was reloaded so the draft shows in Mirador.
    await waitFor(() =>
      expect(viewer.dispatched.some((a) => a.type === 'RECEIVE')).toBe(true),
    );

    fireEvent.click(screen.getByText('assistant.accept'));
    await screen.findByText('assistant.accepted');
    expect(annotationApi.acceptAnnotation).toHaveBeenCalledWith(7, 'd1');
  });

  it('shows errors and lets the user answer confirmations', async () => {
    vi.mocked(api.streamChat).mockImplementation(async (_body, onEvent) => {
      onEvent({ type: 'run', runId: 'r2', conversationId: 1, model: 'm' });
      onEvent({
        type: 'confirm',
        callId: 'c1',
        message: 'Write 20 drafts?',
        estimate: { drafts: 20, costUsd: 0.4 },
      });
      onEvent({
        type: 'error',
        code: 'quota',
        message: 'Monthly token quota reached.',
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    render(
      <AssistantPanel
        projectId={7}
        viewer={fakeViewer()}
        language="en"
        onClose={() => undefined}
      />,
    );
    fireEvent.change(screen.getByLabelText('assistant.placeholder'), {
      target: { value: 'go' },
    });
    fireEvent.click(screen.getByLabelText('assistant.send'));
    await screen.findByText('Monthly token quota reached.');
    fireEvent.click(screen.getByText('assistant.yes'));
    expect(api.answerConfirm).toHaveBeenCalledWith('r2', 'c1', true);
  });

  it("shows the user's own usage this month, with the quotas, and reloads it after an answer", async () => {
    vi.mocked(api.getMyUsage).mockResolvedValue({
      tokensThisMonth: 120000,
      requestsToday: 3,
      costThisMonthUsd: 1.4,
      limits: { tokensPerMonth: 0, requestsPerDay: 50 },
      blockedReason: null,
    });
    vi.mocked(api.streamChat).mockImplementation(async (_body, onEvent) => {
      onEvent({ type: 'text', delta: 'Hello.' });
      onEvent({ type: 'done', stopReason: 'end_turn' });
    });
    render(
      <AssistantPanel
        projectId={7}
        viewer={fakeViewer()}
        language="en"
        onClose={() => undefined}
      />,
    );
    const line = await screen.findByTestId('assistant-usage');
    // Keys: i18n is not initialised in tests. No token quota set, so no token limit.
    expect(line).toHaveTextContent('assistant.usageMonth');
    expect(line).toHaveTextContent('assistant.usageRequestQuota');
    expect(line).not.toHaveTextContent('assistant.usageTokenQuota');
    expect(api.getMyUsage).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('assistant.placeholder'), {
      target: { value: 'hi' },
    });
    fireEvent.click(screen.getByLabelText('assistant.send'));
    await screen.findByText('Hello.');
    await waitFor(() => expect(api.getMyUsage).toHaveBeenCalledTimes(2));
  });

  it('lets the user pick the model, remembers it and sends it', async () => {
    vi.stubGlobal('localStorage', memoryStorage());
    vi.mocked(api.getModels).mockResolvedValue({
      default: 'claude-opus-5-5',
      models: [
        { id: 'claude-opus-5-5', label: 'Opus 5.5', costTier: 3 },
        { id: 'claude-haiku-5-5', label: 'Haiku 5.5', costTier: 1 },
      ],
    });
    vi.mocked(api.streamChat).mockImplementation(async (body, onEvent) => {
      onEvent({
        type: 'run',
        runId: 'r1',
        conversationId: 1,
        model: body.model ?? 'claude-opus-5-5',
      });
      onEvent({ type: 'text', delta: 'Hi.' });
      onEvent({ type: 'done', stopReason: 'end_turn' });
    });
    const panel = () =>
      render(
        <AssistantPanel
          projectId={7}
          viewer={fakeViewer()}
          language="en"
          onClose={() => undefined}
        />,
      );
    const { unmount } = panel();
    const picker = await screen.findByRole('combobox', {
      name: 'assistant.model',
    });
    expect(picker).toHaveTextContent('Opus 5.5');
    fireEvent.mouseDown(picker);
    fireEvent.click(await screen.findByRole('option', { name: /Haiku 5.5/ }));

    fireEvent.change(screen.getByLabelText('assistant.placeholder'), {
      target: { value: 'hi' },
    });
    fireEvent.click(screen.getByLabelText('assistant.send'));
    await screen.findByText('Hi.');
    expect(vi.mocked(api.streamChat).mock.calls[0][0].model).toBe(
      'claude-haiku-5-5',
    );
    // The answer says which model wrote it.
    expect(screen.getByTestId('assistant-run-model')).toHaveTextContent(
      'Haiku 5.5',
    );

    // Remembered on the next opening.
    unmount();
    panel();
    expect(
      await screen.findByRole('combobox', { name: 'assistant.model' }),
    ).toHaveTextContent('Haiku 5.5');
    vi.unstubAllGlobals();
  });

  it('keeps the fast model for the manifest suggestion and hides a one-model picker', async () => {
    vi.mocked(api.getModels).mockResolvedValue({
      default: 'claude-opus-5-5',
      models: [{ id: 'claude-opus-5-5', label: 'Opus 5.5', costTier: 3 }],
    });
    vi.mocked(api.streamChat).mockImplementation(async (_body, onEvent) => {
      onEvent({ type: 'done', stopReason: 'end_turn' });
    });
    render(
      <AssistantPanel
        projectId={7}
        viewer={fakeViewer()}
        language="en"
        onClose={() => undefined}
      />,
    );
    await waitFor(() => expect(api.getModels).toHaveBeenCalled());
    expect(screen.queryByTestId('assistant-model')).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'assistant.suggestManifest' }),
    );
    await waitFor(() => expect(api.streamChat).toHaveBeenCalled());
    const body = vi.mocked(api.streamChat).mock.calls[0][0];
    expect(body.mode).toBe('quick');
    expect(body.model).toBeUndefined();
  });

  it('renders the answer as Markdown, while it streams', async () => {
    vi.mocked(api.streamChat).mockImplementation(async (_body, onEvent) => {
      onEvent({ type: 'text', delta: 'The date is **13' });
      onEvent({ type: 'text', delta: '42**.\n\n- folio 12' });
      onEvent({ type: 'done', stopReason: 'end_turn' });
    });
    render(
      <AssistantPanel
        projectId={7}
        viewer={fakeViewer()}
        language="en"
        onClose={() => undefined}
      />,
    );
    fireEvent.change(screen.getByLabelText('assistant.placeholder'), {
      target: { value: 'date?' },
    });
    fireEvent.click(screen.getByLabelText('assistant.send'));
    const answer = await screen.findByTestId('assistant-text');
    await waitFor(() =>
      expect(answer.querySelector('strong')?.textContent).toBe('1342'),
    );
    expect(answer.querySelector('li')?.textContent).toBe('folio 12');
    // The user's own message stays plain text.
    expect(screen.getByText('date?').querySelector('strong')).toBeNull();
  });
  it('ignores an unexpected model list instead of breaking', async () => {
    vi.mocked(api.getModels).mockResolvedValue({
      messages: [],
    } as unknown as Awaited<ReturnType<typeof api.getModels>>);
    render(
      <AssistantPanel
        projectId={7}
        viewer={fakeViewer()}
        language="en"
        onClose={() => undefined}
      />,
    );
    await waitFor(() => expect(api.getModels).toHaveBeenCalled());
    expect(screen.getByLabelText('assistant.placeholder')).toBeInTheDocument();
    expect(screen.queryByTestId('assistant-model')).toBeNull();
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any -- OpenSeadragon and Mirador's OSDReferences are untyped */
/** Minimal OpenSeadragon: handlers, overlays, viewport where 1 pixel = 2 canvas units. */
function fakeOsd() {
  const handlers: Record<string, ((e: any) => void)[]> = {};
  const overlays: Record<string, unknown> = {};
  class Point {
    constructor(
      public x: number,
      public y: number,
    ) {}

    times(factor: number) {
      return new Point(this.x * factor, this.y * factor);
    }
  }
  class Rect {
    constructor(
      public x: number,
      public y: number,
      public width: number,
      public height: number,
    ) {}

    getTopLeft() {
      return new Point(this.x, this.y);
    }
  }
  return {
    handlers,
    overlays,
    element: document.createElement('div'),
    viewport: {
      getBounds: () => new Rect(0, 0, 1, 1),
      getCenter: () => new Point(0, 0),
      // Like OpenSeadragon: takes any {x, y}, returns its own Point.
      pointFromPixel: (p: { x: number; y: number }) =>
        new Point(p.x * 2, p.y * 2),
      // Like OpenSeadragon: needs a real Point (uses its methods).
      pixelFromPoint: (p: Point) => p.times(0.5),
    },
    addHandler: (name: string, fn: (e: any) => void) => {
      (handlers[name] ??= []).push(fn);
    },
    removeHandler: (name: string, fn: (e: any) => void) => {
      handlers[name] = (handlers[name] ?? []).filter((h) => h !== fn);
    },
    addOverlay: (el: HTMLElement, rect: unknown) => {
      overlays[el.id] = rect;
    },
    updateOverlay: (el: HTMLElement, rect: unknown) => {
      overlays[el.id] = rect;
    },
    removeOverlay: (id: string) => {
      delete overlays[id];
    },
    fire(name: string, position: { x: number; y: number }) {
      const event = {
        position: new Point(position.x, position.y),
        preventDefaultAction: false,
      };
      (handlers[name] ?? []).forEach((h) => h(event));
      return event;
    },
  };
}

describe('region selection', () => {
  const useOsd = (osd: ReturnType<typeof fakeOsd> | undefined) => {
    (mirador.OSDReferences as any).get = () =>
      osd ? { current: osd } : undefined;
  };
  afterEach(() => useOsd(undefined));

  it('regionFromPoints: whole pixels, any drag direction, clamped at 0', () => {
    expect(regionFromPoints({ x: 30.4, y: 40.6 }, { x: 10.2, y: -5 })).toEqual({
      x: 10,
      y: 0,
      w: 20,
      h: 41,
    });
    expect(regionFromPoints({ x: 5, y: 5 }, { x: 5, y: 5 })).toEqual({
      x: 5,
      y: 5,
      w: 1,
      h: 1,
    });
  });

  it('turns a drag on the image into a canvas region, without panning', () => {
    const osd = fakeOsd();
    useOsd(osd);
    const onSelect = vi.fn();
    selectRegion(fakeViewer(), onSelect, vi.fn());
    expect(osd.element.style.cursor).toBe('crosshair');
    expect(
      osd.fire('canvas-press', { x: 10, y: 20 }).preventDefaultAction,
    ).toBe(true);
    expect(osd.fire('canvas-drag', { x: 50, y: 70 }).preventDefaultAction).toBe(
      true,
    );
    osd.fire('canvas-release', { x: 60, y: 80 });
    expect(onSelect).toHaveBeenCalledWith({
      canvasId: CANVAS,
      region: { x: 20, y: 40, w: 100, h: 120 },
    });
    // The outline stays; selection mode ends.
    const outline = osd.element.querySelector<HTMLElement>(
      '#mmu-assistant-region',
    )!;
    // Drawn over the dragged pixels, and kept in place on zoom and pan.
    expect([
      outline.style.left,
      outline.style.top,
      outline.style.width,
      outline.style.height,
    ]).toEqual(['10px', '20px', '50px', '60px']);
    expect(osd.handlers['update-viewport']).toHaveLength(1);
    expect(osd.handlers['canvas-drag']).toHaveLength(0);
    expect(osd.element.style.cursor).toBe('');
  });

  it('Escape cancels and removes the outline; no image cancels at once', () => {
    const osd = fakeOsd();
    useOsd(osd);
    const onCancel = vi.fn();
    selectRegion(fakeViewer(), vi.fn(), onCancel);
    osd.fire('canvas-press', { x: 1, y: 1 });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
    expect(osd.element.querySelector('#mmu-assistant-region')).toBeNull();
    expect(osd.handlers['canvas-press']).toHaveLength(0);
    expect(osd.handlers['update-viewport']).toHaveLength(0);

    useOsd(undefined);
    const onNoImage = vi.fn();
    selectRegion(fakeViewer(), vi.fn(), onNoImage);
    expect(onNoImage).toHaveBeenCalled();
  });

  it('the panel sends the selected region, and drops it on another canvas', async () => {
    const osd = fakeOsd();
    useOsd(osd);
    vi.mocked(api.streamChat).mockImplementation(async (_body, onEvent) => {
      onEvent({ type: 'done', stopReason: 'end_turn' });
    });
    const viewer = fakeViewer();
    render(
      <AssistantPanel
        projectId={7}
        viewer={viewer}
        language="en"
        onClose={() => undefined}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'assistant.selectRegion' }),
    );
    expect(screen.getByText('assistant.selectingRegion')).toBeInTheDocument();
    osd.fire('canvas-press', { x: 10, y: 20 });
    osd.fire('canvas-release', { x: 60, y: 80 });
    expect(await screen.findByTestId('assistant-region')).toHaveTextContent(
      'assistant.region',
    );

    const ask = async (text: string) => {
      fireEvent.change(screen.getByLabelText('assistant.placeholder'), {
        target: { value: text },
      });
      fireEvent.click(screen.getByLabelText('assistant.send'));
      await waitFor(() =>
        expect(vi.mocked(api.streamChat).mock.calls.at(-1)?.[0].message).toBe(
          text,
        ),
      );
      return vi.mocked(api.streamChat).mock.calls.at(-1)![0].context;
    };
    expect((await ask('what is this?')).region).toEqual({
      x: 20,
      y: 40,
      w: 100,
      h: 120,
    });
    // Still about the same region for the next question.
    expect((await ask('and the date?')).region).toEqual({
      x: 20,
      y: 40,
      w: 100,
      h: 120,
    });

    // The user moved to another canvas: the region no longer applies.
    const state = viewer.store.getState();
    viewer.store.getState = () => ({
      ...state,
      windows: {
        w1: { ...state.windows.w1, canvasId: 'https://example.org/canvas/2' },
      },
    });
    expect((await ask('next page?')).region).toBeUndefined();
    await waitFor(() =>
      expect(screen.queryByTestId('assistant-region')).toBeNull(),
    );
    expect(osd.element.querySelector('#mmu-assistant-region')).toBeNull();
  });
});
