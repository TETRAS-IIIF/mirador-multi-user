/* eslint-disable @typescript-eslint/no-explicit-any -- Mirador's Redux state and OSD viewer are untyped. */
import {
  addCompanionWindow,
  hoverAnnotation,
  OSDReferences,
  receiveAnnotation,
  setCanvas,
} from 'mirador';
import MMUAdapter from '../mirador/adapter/MMUAdapter';
import type { Region } from './api.ts';

/**
 * Glue between the assistant and the Mirador viewer: reads what the user is
 * looking at, and runs the viewer actions Claude asks for.
 */
type Viewer = {
  store: { getState: () => any; dispatch: (action: unknown) => void };
};

/** The window to act on: the focused one, else the first one. */
export function activeWindow(viewer: Viewer | undefined) {
  const state = viewer?.store?.getState();
  if (!state) return null;
  const ids: string[] =
    state.workspace?.windowIds ?? Object.keys(state.windows ?? {});
  const id = state.workspace?.focusedWindowId ?? ids[0];
  const window = id ? state.windows?.[id] : null;
  return window
    ? { id, manifestId: window.manifestId, canvasId: window.canvasId }
    : null;
}

/** Context sent with each message: open manifest and canvas. */
export function viewerContext(viewer: Viewer | undefined) {
  const window = activeWindow(viewer);
  return window
    ? { manifestId: window.manifestId, canvasId: window.canvasId }
    : {};
}

/** Reloads a canvas's annotation page (e.g. after a draft was written). */
export async function refreshCanvas(
  viewer: Viewer | undefined,
  projectId: number,
  canvasId: string,
  showDrafts: () => boolean,
) {
  if (!viewer) return;
  const adapter = new MMUAdapter(projectId, `${canvasId}/annotationPage`, '', {
    showDrafts,
  });
  const page = await adapter.all();
  viewer.store.dispatch(
    receiveAnnotation(canvasId, adapter.annotationPageId, page),
  );
}

/** Opens the annotation list of the active window (the review list). */
export function openAnnotationList(viewer: Viewer | undefined) {
  const window = activeWindow(viewer);
  if (!viewer || !window) return;
  viewer.store.dispatch(
    addCompanionWindow(window.id, {
      content: 'annotations',
      position: 'right',
    }),
  );
}

/** Runs a viewer action and returns a short text result for Claude. */
export function runViewerAction(
  viewer: Viewer | undefined,
  action: string,
  args: Record<string, any>,
): string {
  const window = activeWindow(viewer);
  if (!viewer || !window) return 'No viewer window is open.';
  switch (action) {
    case 'open_canvas':
      viewer.store.dispatch(setCanvas(window.id, String(args.canvas_id)));
      return `Opened ${args.canvas_id}.`;
    case 'zoom_to': {
      if (window.canvasId !== args.canvas_id) {
        viewer.store.dispatch(setCanvas(window.id, String(args.canvas_id)));
      }
      const region = args.region as Region | undefined;
      const osd = OSDReferences?.get(window.id)?.current as any;
      const viewport = osd?.viewport;
      if (!region || !viewport)
        return 'Opened the canvas; zoom is not available.';
      // Mirador lays canvases out in canvas pixels, so canvas coordinates
      // are viewport coordinates for the canvas shown first.
      const Rect = viewport.getBounds().constructor;
      viewport.fitBounds(new Rect(region.x, region.y, region.w, region.h));
      return 'Zoomed on the region.';
    }
    case 'highlight':
      viewer.store.dispatch(
        hoverAnnotation(window.id, (args.annotation_ids as string[]) ?? []),
      );
      return 'Highlighted.';
    default:
      return `Unknown viewer action ${action}.`;
  }
}
