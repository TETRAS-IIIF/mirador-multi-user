/* eslint-disable @typescript-eslint/no-explicit-any -- Mirador's Redux state is untyped. */
import { useEffect, useRef } from 'react';
import { getConfig, getVisibleCanvasIds, receiveAnnotation } from 'mirador';
import { getShowDrafts } from '../../assistant/draftsState.ts';
import MMUAdapter from '../adapter/MMUAdapter';

/**
 * Keeps the viewer up to date with what others save on the same canvases.
 *
 * MMU has no push channel, so this polls: every `LIVE_REFRESH_MS`, while the
 * tab is visible, it re-reads the annotation page of each visible canvas and
 * updates Mirador only when the page changed. It pauses while an annotation
 * is being edited in the window, so the editor is never disturbed (a save
 * over someone else's change is refused by the server instead).
 */

export const LIVE_REFRESH_MS = 15000;

type Dispatch = (action: unknown) => void;

const pageIdOf = (canvasId: string) => `${canvasId}/annotationPage`;

/** Stable summary of a page's annotations, to tell whether it changed. */
export function pageFingerprint(page: any): string {
  return JSON.stringify(page?.items ?? []);
}

/** True when the window has an annotation editor open. */
export function isEditing(state: any, windowId: string): boolean {
  const ids: string[] = state?.windows?.[windowId]?.companionWindowIds ?? [];
  return ids.some(
    (id) => state?.companionWindows?.[id]?.content === 'annotationCreation',
  );
}

/** Pages of the visible canvases as Mirador holds them now (same objects). */
function storedPages(state: any, canvasIds: string[]) {
  return Object.fromEntries(
    canvasIds.map((id) => [id, state?.annotations?.[id]?.[pageIdOf(id)]?.json]),
  );
}

/** Re-reads each canvas and dispatches the ones that changed. */
export async function refreshChanged(
  dispatch: Dispatch,
  projectId: number,
  canvasIds: string[],
  stored: Record<string, any>,
) {
  await Promise.all(
    canvasIds.map(async (canvasId) => {
      const adapter = new MMUAdapter(projectId, pageIdOf(canvasId), '', {
        showDrafts: () => getShowDrafts(projectId),
      });
      const page = await adapter.all();
      if (pageFingerprint(page) !== pageFingerprint(stored[canvasId])) {
        dispatch(receiveAnnotation(canvasId, adapter.annotationPageId, page));
      }
    }),
  );
}

type Props = {
  projectId: number;
  canvasIds: string[];
  editing: boolean;
  pages: Record<string, any>;
  dispatch: Dispatch;
};

// eslint-disable-next-line react-refresh/only-export-components -- Mirador plugin component
function LiveRefresh({
  projectId,
  canvasIds,
  editing,
  pages,
  dispatch,
}: Props) {
  // Read inside the timer: the latest values, without restarting it.
  const latest = useRef({ canvasIds, editing, pages });
  latest.current = { canvasIds, editing, pages };

  useEffect(() => {
    if (!projectId) return;
    let busy = false;
    const timer = setInterval(() => {
      const { canvasIds: ids, editing: paused, pages: stored } = latest.current;
      if (busy || paused || ids.length === 0) return;
      if (document.visibilityState === 'hidden') return;
      busy = true;
      refreshChanged(dispatch, projectId, ids, stored)
        .catch(() => undefined) // Offline or logged out: try again later.
        .finally(() => {
          busy = false;
        });
    }, LIVE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [projectId, dispatch]);

  return null;
}

const mapStateToProps = (state: any, { windowId }: { windowId: string }) => {
  const canvasIds: string[] = getVisibleCanvasIds(state, { windowId }) ?? [];
  return {
    projectId: Number(getConfig(state).projectId) || 0,
    canvasIds,
    editing: isEditing(state, windowId),
    pages: storedPages(state, canvasIds),
  };
};

export const liveRefreshPlugin = {
  component: LiveRefresh,
  mapDispatchToProps: (dispatch: Dispatch) => ({ dispatch }),
  mapStateToProps,
  mode: 'add',
  target: 'WindowTopBarPluginArea',
};
