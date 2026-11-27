import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  acceptAnnotation,
  acceptAnnotations,
  type AnnotationBatch,
  type AnnotationFilter,
  type AnnotationRow,
  deleteAnnotation,
  deleteAnnotations,
  listAnnotations,
  listBatches,
} from '../../mirador/api/annotationApi.ts';
import { draftTags, draftText } from '../draftContent.ts';
import { refreshCanvas, runViewerAction } from '../viewerBridge.ts';
import { canvasLabel, canvasOfPage } from '../reviewQueue.ts';

type Props = {
  open: boolean;
  onClose: () => void;
  projectId: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mirador viewer instance
  viewer: any;
  showDrafts: () => boolean;
  /** Called after drafts were accepted or rejected (e.g. to update counts). */
  onChanged?: () => void;
};

const ALL = '';
/** Selects show "All" (the empty value) instead of an empty box. */
const showAll = {
  inputLabel: { shrink: true },
  select: { displayEmpty: true },
};

/**
 * Every draft of the project in one list, with filters (canvas, batch, tag),
 * Accept / Reject / Show, bulk actions on the filtered list, and keyboard
 * shortcuts: J / K to move, A to accept, R to reject, S to show.
 */
export function DraftReviewDialog({
  open,
  onClose,
  projectId,
  viewer,
  showDrafts,
  onChanged,
}: Props) {
  const { t } = useTranslation();
  const [drafts, setDrafts] = useState<AnnotationRow[] | null>(null);
  const [batches, setBatches] = useState<AnnotationBatch[]>([]);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [canvas, setCanvas] = useState(ALL);
  const [batch, setBatch] = useState(ALL);
  const [tag, setTag] = useState(ALL);
  const [current, setCurrent] = useState(0);
  const [confirming, setConfirming] = useState<'accept' | 'reject' | null>(
    null,
  );
  const listRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [rows, jobs] = await Promise.all([
        listAnnotations({ projectId, status: 'draft' }),
        listBatches(projectId).catch(() => []),
      ]);
      setDrafts(rows);
      setBatches(jobs);
    } catch (e) {
      console.error(e);
      setError(true);
      setDrafts([]);
    }
  }, [projectId]);

  useEffect(() => {
    if (!open) return;
    setDrafts(null);
    setConfirming(null);
    load();
  }, [open, load]);

  const canvases = useMemo(
    () => [
      ...new Set((drafts ?? []).map((d) => canvasOfPage(d.annotationPageId))),
    ],
    [drafts],
  );
  const tags = useMemo(
    () =>
      [...new Set((drafts ?? []).flatMap((d) => draftTags(d.content)))].sort(),
    [drafts],
  );
  const visible = useMemo(
    () =>
      (drafts ?? []).filter(
        (d) =>
          (canvas === ALL || canvasOfPage(d.annotationPageId) === canvas) &&
          (batch === ALL || String(d.batchId) === batch) &&
          (tag === ALL || draftTags(d.content).includes(tag)),
      ),
    [drafts, canvas, batch, tag],
  );

  useEffect(() => {
    if (current >= visible.length) setCurrent(Math.max(0, visible.length - 1));
  }, [visible.length, current]);

  /** Reloads the given canvases in Mirador, then the list. */
  const afterChange = async (pageIds: string[]) => {
    await Promise.all(
      [...new Set(pageIds)].map((pageId) =>
        refreshCanvas(
          viewer,
          projectId,
          canvasOfPage(pageId),
          showDrafts,
        ).catch(console.error),
      ),
    );
    onChanged?.();
  };

  const decide = async (draft: AnnotationRow, accept: boolean) => {
    setBusy(true);
    try {
      if (accept) await acceptAnnotation(projectId, draft.id);
      else await deleteAnnotation(projectId, draft.id);
      setDrafts((prev) => (prev ?? []).filter((d) => d.id !== draft.id));
      await afterChange([draft.annotationPageId]);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  /** Accepts or rejects the whole filtered list. */
  const decideAll = async (accept: boolean) => {
    setConfirming(null);
    setBusy(true);
    const targets = visible;
    try {
      if (tag === ALL) {
        // One request: same filter on the server.
        const filter: AnnotationFilter = { projectId, status: 'draft' };
        if (canvas !== ALL)
          filter.annotationPageId = `${canvas}/annotationPage`;
        if (batch !== ALL) filter.batchId = Number(batch);
        if (accept) await acceptAnnotations(filter);
        else await deleteAnnotations(filter);
      } else {
        for (const draft of targets) {
          if (accept) await acceptAnnotation(projectId, draft.id);
          else await deleteAnnotation(projectId, draft.id);
        }
      }
      await afterChange(targets.map((d) => d.annotationPageId));
      await load();
    } catch (e) {
      console.error(e);
      setError(true);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const show = (draft: AnnotationRow) => {
    runViewerAction(viewer, 'open_canvas', {
      canvas_id: canvasOfPage(draft.annotationPageId),
    });
    onClose();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (busy || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    if (target.getAttribute('role') === 'combobox') return;
    const draft = visible[current];
    const key = event.key.toLowerCase();
    if (key === 'j' || event.key === 'ArrowDown') {
      setCurrent((i) => Math.min(i + 1, visible.length - 1));
    } else if (key === 'k' || event.key === 'ArrowUp') {
      setCurrent((i) => Math.max(i - 1, 0));
    } else if (key === 'a' && draft) {
      decide(draft, true);
    } else if (key === 'r' && draft) {
      decide(draft, false);
    } else if (key === 's' && draft) {
      show(draft);
    } else {
      return;
    }
    event.preventDefault();
  };

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${current}"]`)
      ?.scrollIntoView?.({ block: 'nearest' });
  }, [current]);

  const batchLabel = (id: number | null) => {
    const job = batches.find((b) => b.id === id);
    if (!job) return id === null ? t('reviewQueue.noBatch') : `#${id}`;
    const date = job.createdAt ? new Date(job.createdAt).toLocaleString() : '';
    return `#${job.id} · ${date}${job.model ? ` · ${job.model}` : ''}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      onKeyDown={onKeyDown}
      aria-labelledby="draft-review-title"
    >
      <DialogTitle id="draft-review-title">
        {t('reviewQueue.title', { count: drafts?.length ?? 0 })}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ flexWrap: 'wrap' }}
            useFlexGap
          >
            <TextField
              select
              size="small"
              slotProps={showAll}
              label={t('reviewQueue.canvas')}
              value={canvas}
              onChange={(e) => setCanvas(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value={ALL}>{t('reviewQueue.all')}</MenuItem>
              {canvases.map((id) => (
                <MenuItem key={id} value={id}>
                  {canvasLabel(viewer, id)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              slotProps={showAll}
              label={t('reviewQueue.batch')}
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value={ALL}>{t('reviewQueue.all')}</MenuItem>
              {[...new Set((drafts ?? []).map((d) => d.batchId))].map((id) => (
                <MenuItem key={String(id)} value={String(id)}>
                  {batchLabel(id)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              slotProps={showAll}
              label={t('reviewQueue.tag')}
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value={ALL}>{t('reviewQueue.all')}</MenuItem>
              {tags.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          {error && <Alert severity="error">{t('reviewQueue.error')}</Alert>}
          <Typography variant="caption" color="text.secondary">
            {t('reviewQueue.shortcuts')}
          </Typography>
          {drafts === null ? (
            <CircularProgress size={24} />
          ) : visible.length === 0 ? (
            <Typography color="text.secondary">
              {t('reviewQueue.empty')}
            </Typography>
          ) : (
            <Stack spacing={1} ref={listRef} data-testid="review-list">
              {visible.map((draft, index) => (
                <Box
                  key={draft.id}
                  data-index={index}
                  data-testid="review-item"
                  aria-current={index === current}
                  onClick={() => setCurrent(index)}
                  sx={{
                    border: 1,
                    borderColor: index === current ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    p: 1,
                    outline: index === current ? '1px solid' : 'none',
                    outlineColor: 'primary.main',
                  }}
                >
                  <Typography variant="body2">
                    {draftText(draft.content) || t('reviewQueue.noText')}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    useFlexGap
                    sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}
                  >
                    {draftTags(draft.content).map((value) => (
                      <Chip key={value} size="small" label={value} />
                    ))}
                    <Typography variant="caption" color="text.secondary">
                      {canvasLabel(
                        viewer,
                        canvasOfPage(draft.annotationPageId),
                      )}
                      {' · '}
                      {batchLabel(draft.batchId)}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button size="small" onClick={() => show(draft)}>
                      {t('reviewQueue.show')}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      disabled={busy}
                      onClick={() => decide(draft, false)}
                    >
                      {t('assistant.reject')}
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={busy}
                      onClick={() => decide(draft, true)}
                    >
                      {t('assistant.accept')}
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        {confirming ? (
          <>
            <Typography variant="body2" sx={{ mr: 1 }}>
              {t(
                confirming === 'accept'
                  ? 'reviewQueue.confirmAccept'
                  : 'reviewQueue.confirmReject',
                { count: visible.length },
              )}
            </Typography>
            <Button onClick={() => setConfirming(null)}>
              {t('assistant.no')}
            </Button>
            <Button
              variant="contained"
              color={confirming === 'accept' ? 'primary' : 'error'}
              onClick={() => decideAll(confirming === 'accept')}
            >
              {t('reviewQueue.confirm')}
            </Button>
          </>
        ) : (
          <>
            <Button
              color="error"
              disabled={busy || visible.length === 0}
              onClick={() => setConfirming('reject')}
            >
              {t('reviewQueue.rejectAll', { count: visible.length })}
            </Button>
            <Button
              disabled={busy || visible.length === 0}
              onClick={() => setConfirming('accept')}
            >
              {t('reviewQueue.acceptAll', { count: visible.length })}
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button onClick={onClose}>{t('assistant.close')}</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
