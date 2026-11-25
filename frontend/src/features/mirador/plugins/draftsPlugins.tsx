/* eslint-disable @typescript-eslint/no-explicit-any -- Mirador's Redux state and OSD viewer are untyped. */
import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  Badge,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Switch,
  Tooltip,
} from '@mui/material';
import RateReviewIcon from '@mui/icons-material/RateReview';
import {
  addCompanionWindow,
  getConfig,
  getVisibleCanvasIds,
  receiveAnnotation,
} from 'mirador';
import { useTranslation } from 'react-i18next';
import {
  getShowDrafts,
  setShowDrafts,
  subscribeShowDrafts,
} from '../../assistant/draftsState.ts';
import { countAnnotationsByPage } from '../api/annotationApi.ts';
import MMUAdapter from '../adapter/MMUAdapter';

/**
 * Two small Mirador plugins for draft annotations (suggestions waiting for
 * review): a "Show drafts" switch in the window menu, and a draft counter in
 * the window top bar that opens the annotation list, where MAEV shows
 * Accept / Reject.
 */

type Dispatch = (action: unknown) => void;

const useShowDrafts = (projectId: number) =>
  useSyncExternalStore(subscribeShowDrafts, () => getShowDrafts(projectId));

/** Reloads the visible canvases so drafts appear or disappear. */
async function reloadCanvases(
  dispatch: Dispatch,
  projectId: number,
  canvasIds: string[],
) {
  await Promise.all(
    canvasIds.map(async (canvasId) => {
      const adapter = new MMUAdapter(
        projectId,
        `${canvasId}/annotationPage`,
        '',
        { showDrafts: () => getShowDrafts(projectId) },
      );
      const page = await adapter.all();
      dispatch(receiveAnnotation(canvasId, adapter.annotationPageId, page));
    }),
  );
}

type PluginProps = {
  projectId: number;
  canvasIds: string[];
  windowId: string;
  dispatch: Dispatch;
  annotationsKey: string;
};

// eslint-disable-next-line react-refresh/only-export-components -- Mirador plugin component
function ShowDraftsMenuItem({
  projectId,
  canvasIds,
  dispatch,
}: PluginProps & { handleClose?: () => void }) {
  const { t } = useTranslation();
  const show = useShowDrafts(projectId);
  if (!projectId) return null;
  const toggle = () => {
    setShowDrafts(projectId, !show);
    reloadCanvases(dispatch, projectId, canvasIds).catch(console.error);
  };
  return (
    <MenuItem onClick={toggle} data-testid="show-drafts-menu-item">
      <ListItemIcon>
        <Switch size="small" checked={show} edge="start" tabIndex={-1} />
      </ListItemIcon>
      <ListItemText primary={t('assistant.showDrafts')} />
    </MenuItem>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- Mirador plugin component
function DraftCounter({
  projectId,
  canvasIds,
  windowId,
  dispatch,
  annotationsKey,
}: PluginProps) {
  const { t } = useTranslation();
  const [count, setCount] = useState(0);
  const canvasKey = canvasIds.join('|');
  const show = useShowDrafts(projectId);

  useEffect(() => {
    if (!projectId || canvasIds.length === 0) return;
    let cancelled = false;
    countAnnotationsByPage({ projectId, status: 'draft' })
      .then((byPage) => {
        if (cancelled) return;
        setCount(
          canvasIds.reduce(
            (sum, id) => sum + (byPage[`${id}/annotationPage`] ?? 0),
            0,
          ),
        );
      })
      .catch(() => !cancelled && setCount(0));
    return () => {
      cancelled = true;
    };
    // canvasKey/annotationsKey change whenever the canvases or their annotations change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, canvasKey, annotationsKey]);

  if (!projectId || count === 0) return null;
  const openReview = () => {
    if (!show) {
      setShowDrafts(projectId, true);
      reloadCanvases(dispatch, projectId, canvasIds).catch(console.error);
    }
    dispatch(
      addCompanionWindow(windowId, {
        content: 'annotations',
        position: 'right',
      }),
    );
  };
  return (
    <Tooltip title={t('assistant.reviewDrafts', { count })}>
      <IconButton
        aria-label={t('assistant.reviewDrafts', { count })}
        onClick={openReview}
        data-testid="draft-counter"
      >
        <Badge badgeContent={count} color="warning">
          <RateReviewIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}

const mapStateToProps = (state: any, { windowId }: { windowId: string }) => {
  const canvasIds: string[] = getVisibleCanvasIds(state, { windowId }) ?? [];
  return {
    projectId: Number(getConfig(state).projectId) || 0,
    canvasIds,
    // Changes when an annotation is added, removed, accepted or rejected.
    annotationsKey: canvasIds
      .map((id) =>
        Object.values(state.annotations?.[id] ?? {})
          .map((page: any) =>
            (page?.json?.items ?? [])
              .map((item: any) => `${item?.id}:${item?.['mmu:status'] ?? ''}`)
              .join(','),
          )
          .join(';'),
      )
      .join('|'),
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({ dispatch });

export const showDraftsMenuPlugin = {
  component: ShowDraftsMenuItem,
  mapDispatchToProps,
  mapStateToProps,
  mode: 'add',
  target: 'WindowTopBarPluginMenu',
};

export const draftCounterPlugin = {
  component: DraftCounter,
  mapDispatchToProps,
  mapStateToProps,
  mode: 'add',
  target: 'WindowTopBarPluginArea',
};

export const draftsPlugins = [showDraftsMenuPlugin, draftCounterPlugin];
