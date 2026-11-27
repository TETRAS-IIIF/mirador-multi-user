/* eslint-disable @typescript-eslint/no-explicit-any -- OpenSeadragon and Mirador's OSDReferences are untyped */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const osdRef: { current: any } = { current: undefined };

vi.mock('mirador', () => ({
  addCompanionWindow: (windowId: string, payload: unknown) => ({
    type: 'ADD_CW',
    windowId,
    payload,
  }),
  hoverAnnotation: () => ({ type: 'HOVER' }),
  receiveAnnotation: () => ({ type: 'RECEIVE' }),
  selectAnnotation: (windowId: string, annotationId: string) => ({
    type: 'SELECT',
    windowId,
    annotationId,
  }),
  setCanvas: (windowId: string, canvasId: string) => ({
    type: 'SET_CANVAS',
    windowId,
    canvasId,
  }),
  OSDReferences: { get: () => osdRef },
}));
vi.mock('../mirador/api/gettingAnnotationPage.ts', () => ({
  gettingAnnotationPage: vi.fn(async () => []),
}));
vi.mock('./api.ts', async () => {
  const actual = await vi.importActual<object>('./api.ts');
  return {
    ...actual,
    streamChat: vi.fn(),
    getHistory: vi.fn(async () => ({ messages: [] })),
    getMyUsage: vi.fn(async () => null),
    getModels: vi.fn(async () => null),
  };
});

import * as api from './api.ts';
import {
  runViewerAction,
  showAnnotation,
  targetRegion,
} from './viewerBridge.ts';
import { AssistantPanel } from './components/AssistantPanel.tsx';

const CANVAS = 'https://example.org/canvas/1';
const OTHER = 'https://example.org/canvas/2';

function fakeViewer(canvasId = CANVAS) {
  const dispatched: any[] = [];
  return {
    dispatched,
    store: {
      dispatch: (a: unknown) => dispatched.push(a),
      getState: () => ({
        windows: { w1: { manifestId: 'm', canvasId } },
        workspace: { windowIds: ['w1'], focusedWindowId: 'w1' },
      }),
    },
  };
}

/** OpenSeadragon-like: its Rect instances report Object as their constructor. */
function fakeOsd() {
  const RectProto = { kind: 'osd-rect' };
  const once: Record<string, () => void> = {};
  return {
    once,
    viewport: {
      getBounds: () =>
        Object.assign(Object.create(RectProto), {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        }),
      fitBounds: vi.fn(),
    },
    addOnceHandler: (name: string, fn: () => void) => {
      once[name] = fn;
    },
    RectProto,
  };
}

describe('targetRegion', () => {
  it.each([
    [`${CANVAS}#xywh=10,20,30,40`, { x: 10, y: 20, w: 30, h: 40 }],
    [`${CANVAS}#xywh=10,20,30,40&t=1,2`, { x: 10, y: 20, w: 30, h: 40 }],
    [
      {
        source: CANVAS,
        selector: {
          type: 'FragmentSelector',
          value: 'xywh=pixel:1,2,3,4',
        },
      },
      { x: 1, y: 2, w: 3, h: 4 },
    ],
    [
      {
        source: { id: CANVAS },
        selector: [
          {
            type: 'SvgSelector',
            value: '<svg><path d="M10,20 L110,20 L110,70 Z"/></svg>',
          },
          { type: 'FragmentSelector', value: 'xywh=5,6,7,8' },
        ],
      },
      { x: 5, y: 6, w: 7, h: 8 },
    ],
    [
      {
        source: CANVAS,
        selector: {
          type: 'SvgSelector',
          value: '<svg><path d="M10,20 L110,20 L110,70 Z"/></svg>',
        },
      },
      { x: 10, y: 20, w: 100, h: 50 },
    ],
  ])('reads the canvas and region of %j', (target, region) => {
    expect(targetRegion(target)).toEqual({ canvasId: CANVAS, region });
  });

  it('whole-canvas targets have no region; unreadable ones none at all', () => {
    expect(targetRegion(CANVAS)).toEqual({ canvasId: CANVAS, region: null });
    expect(targetRegion({ source: CANVAS })).toEqual({
      canvasId: CANVAS,
      region: null,
    });
    expect(targetRegion(undefined)).toBeNull();
  });
});

describe('showAnnotation', () => {
  beforeEach(() => {
    osdRef.current = fakeOsd();
  });

  it('zooms on the region, with a margin, and selects the annotation', () => {
    const viewer = fakeViewer();
    showAnnotation(viewer, {
      id: 'a1',
      canvasId: CANVAS,
      target: `${CANVAS}#xywh=100,200,40,80`,
    });
    const rect = osdRef.current.viewport.fitBounds.mock.calls[0][0];
    // A real OpenSeadragon Rect (its prototype), 25% margin.
    expect(Object.getPrototypeOf(rect)).toBe(osdRef.current.RectProto);
    expect(rect).toMatchObject({ x: 90, y: 180, width: 60, height: 120 });
    expect(viewer.dispatched).toEqual([
      { type: 'SELECT', windowId: 'w1', annotationId: 'a1' },
    ]);
  });

  it('opens another canvas first, and zooms once it is open', () => {
    const viewer = fakeViewer(OTHER);
    showAnnotation(viewer, {
      id: 'a1',
      canvasId: CANVAS,
      target: `${CANVAS}#xywh=0,0,10,10`,
    });
    expect(viewer.dispatched).toEqual([
      { type: 'SET_CANVAS', windowId: 'w1', canvasId: CANVAS },
    ]);
    expect(osdRef.current.viewport.fitBounds).not.toHaveBeenCalled();
    osdRef.current.once.open();
    expect(osdRef.current.viewport.fitBounds).toHaveBeenCalledTimes(1);
    expect(viewer.dispatched.at(-1)).toMatchObject({ type: 'SELECT' });
  });

  it('only selects a whole-canvas annotation', () => {
    const viewer = fakeViewer();
    showAnnotation(viewer, { id: 'a1', canvasId: CANVAS, target: CANVAS });
    expect(osdRef.current.viewport.fitBounds).not.toHaveBeenCalled();
    expect(viewer.dispatched).toEqual([
      { type: 'SELECT', windowId: 'w1', annotationId: 'a1' },
    ]);
  });
});

describe('zoom_to viewer action', () => {
  it('fits the region with a real OpenSeadragon Rect', () => {
    osdRef.current = fakeOsd();
    const result = runViewerAction(fakeViewer(), 'zoom_to', {
      canvas_id: CANVAS,
      region: { x: 1, y: 2, w: 3, h: 4 },
    });
    expect(result).toBe('Zoomed on the region.');
    const rect = osdRef.current.viewport.fitBounds.mock.calls[0][0];
    expect(Object.getPrototypeOf(rect)).toBe(osdRef.current.RectProto);
    expect(rect).toMatchObject({ x: 1, y: 2, width: 3, height: 4 });
  });
});

describe('draft card', () => {
  it('shows the draft on the image when clicked', async () => {
    osdRef.current = fakeOsd();
    vi.mocked(api.streamChat).mockImplementation(async (_body, onEvent) => {
      onEvent({
        type: 'draft',
        annotationId: 'd1',
        annotationPageId: `${CANVAS}/annotationPage`,
        canvasId: CANVAS,
        batchId: 1,
        annotation: {
          body: [{ purpose: 'describing', value: '<p>anno domini</p>' }],
          target: {
            source: CANVAS,
            selector: { type: 'FragmentSelector', value: 'xywh=10,20,30,40' },
          },
        },
        cropUrl: null,
      });
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
    fireEvent.change(screen.getByLabelText('assistant.placeholder'), {
      target: { value: 'annotate' },
    });
    fireEvent.click(screen.getByLabelText('assistant.send'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'assistant.showOnImage' }),
    );
    expect(osdRef.current.viewport.fitBounds).toHaveBeenCalled();
    expect(viewer.dispatched).toContainEqual({
      type: 'SELECT',
      windowId: 'w1',
      annotationId: 'd1',
    });
  });
});
