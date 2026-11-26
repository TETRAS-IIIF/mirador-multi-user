import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  };
});

import * as api from './api.ts';
import * as annotationApi from '../mirador/api/annotationApi.ts';
import {
  activeWindow,
  runViewerAction,
  viewerContext,
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

describe('draftsState', () => {
  beforeEach(() => localStorage.clear());
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
});
