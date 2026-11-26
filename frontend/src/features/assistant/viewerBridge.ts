/* eslint-disable @typescript-eslint/no-explicit-any -- Mirador's Redux state and OSD viewer are untyped. */
import {
  addCompanionWindow,
  hoverAnnotation,
  OSDReferences,
  receiveAnnotation,
  selectAnnotation,
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
      if (!region || !osd?.viewport)
        return 'Opened the canvas; zoom is not available.';
      zoomTo(osd, region, 0);
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

/**
 * Fits `region` (canvas pixels) in the viewer, with `margin` (fraction of the
 * region) around it. Mirador lays canvases out in canvas pixels, so canvas
 * coordinates are viewport coordinates for the canvas shown first.
 */
function zoomTo(osd: any, region: Region, margin = 0.25) {
  const viewport = osd.viewport;
  // OpenSeadragon's Rect (Mirador doesn't export it, and its instances report
  // Object as their constructor): made from the prototype of a Rect it created.
  const bounds = viewport.getBounds();
  const mx = region.w * margin;
  const my = region.h * margin;
  const rect = Object.assign(Object.create(Object.getPrototypeOf(bounds)), {
    x: region.x - mx,
    y: region.y - my,
    width: region.w + 2 * mx,
    height: region.h + 2 * my,
    degrees: 0,
  });
  viewport.fitBounds(rect);
}

/** Bounding box of the numbers in an SVG selector's shapes (x y pairs). */
function svgBounds(svg: string): Region | null {
  const values: number[] = [];
  for (const match of svg.matchAll(/\b(?:d|points)="([^"]*)"/g)) {
    values.push(...(match[1].match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number));
  }
  const xs = values.filter((_, i) => i % 2 === 0);
  const ys = values.filter((_, i) => i % 2 === 1);
  if (!xs.length || !ys.length) return null;
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

const xywh = (value: string): Region | null => {
  const m = value.match(
    /xywh=(?:pixel:)?(-?[\d.]+),(-?[\d.]+),([\d.]+),([\d.]+)/,
  );
  return m ? { x: +m[1], y: +m[2], w: +m[3], h: +m[4] } : null;
};

/**
 * Canvas and bounding box of a W3C annotation target: "canvas#xywh=…",
 * { source, selector: FragmentSelector | SvgSelector | [..] }. The region is
 * null when the target is the whole canvas.
 */
export function targetRegion(
  target: any,
): { canvasId: string; region: Region | null } | null {
  const first = Array.isArray(target) ? target[0] : target;
  if (!first) return null;
  if (typeof first === 'string') {
    const [canvasId, fragment = ''] = first.split('#');
    return { canvasId, region: xywh(fragment) };
  }
  const source = first.source?.id ?? first.source;
  if (typeof source !== 'string') return null;
  const selectors = Array.isArray(first.selector)
    ? first.selector
    : [first.selector].filter(Boolean);
  for (const selector of selectors) {
    if (selector?.type === 'FragmentSelector') {
      const region = xywh(String(selector.value ?? ''));
      if (region) return { canvasId: source, region };
    }
  }
  for (const selector of selectors) {
    if (selector?.type === 'SvgSelector') {
      const region = svgBounds(String(selector.value ?? ''));
      if (region) return { canvasId: source, region };
    }
  }
  return { canvasId: source, region: null };
}

/**
 * Shows an annotation in the active window: opens its canvas if needed,
 * zooms on its region (with a margin) and selects it, so it is highlighted.
 */
export function showAnnotation(
  viewer: Viewer | undefined,
  annotation: { id: string; canvasId: string; target: unknown },
) {
  const window = activeWindow(viewer);
  if (!viewer || !window) return;
  const located = targetRegion(annotation.target);
  const canvasId = located?.canvasId ?? annotation.canvasId;
  const osd = OSDReferences?.get(window.id)?.current as any;
  const zoom = () => {
    if (located?.region && osd?.viewport) zoomTo(osd, located.region);
    viewer.store.dispatch(selectAnnotation(window.id, annotation.id));
  };
  if (window.canvasId !== canvasId) {
    viewer.store.dispatch(setCanvas(window.id, canvasId));
    // Zoom once the new canvas is open.
    if (osd?.addOnceHandler) osd.addOnceHandler('open', zoom);
    else setTimeout(zoom, 500);
    return;
  }
  zoom();
}
