import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
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
  AssistantRequestError,
  estimateJob,
  type JobEstimate,
  startJob,
} from '../api.ts';
import { activeWindow } from '../viewerBridge.ts';
import { workspaceManifests } from '../jobs.ts';

type Props = {
  open: boolean;
  onClose: () => void;
  projectId: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mirador viewer instance
  viewer: any;
  model: string | null;
  language: string;
  onStarted: (runId: string, title: string) => void;
};

/**
 * Starts a background job: the same instructions on every canvas (or a
 * range) of a manifest. Shows the canvas count and a rough cost first.
 */
export function JobDialog({
  open,
  onClose,
  projectId,
  viewer,
  model,
  language,
  onStarted,
}: Props) {
  const { t } = useTranslation();
  const manifests = useMemo(
    () => (open ? workspaceManifests(viewer) : []),
    [open, viewer],
  );
  const [manifestId, setManifestId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [estimate, setEstimate] = useState<JobEstimate | null>(null);
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEstimate(null);
    setError(null);
    setManifestId(activeWindow(viewer)?.manifestId ?? manifests[0]?.id ?? '');
  }, [open, viewer, manifests]);

  const request = (canvasIds?: string[]) => ({
    projectId,
    manifestId,
    instructions,
    language,
    ...(model ? { model } : {}),
    ...(canvasIds ? { canvasIds } : {}),
  });

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof AssistantRequestError
          ? e.message
          : t('assistant.unreachable'),
      );
    } finally {
      setBusy(false);
    }
  };

  const doEstimate = () =>
    run(async () => {
      const result = await estimateJob(request());
      setEstimate(result);
      setFrom(0);
      setTo(result.canvases.length - 1);
    });

  const selected = estimate ? estimate.canvases.slice(from, to + 1) : [];
  const cost = estimate
    ? Math.round(estimate.perCanvasUsd * selected.length * 100) / 100
    : 0;

  const doStart = () =>
    run(async () => {
      if (!estimate) return;
      const all = selected.length === estimate.canvases.length;
      const { runId } = await startJob(
        request(all ? undefined : selected.map((c) => c.id)),
      );
      onStarted(runId, estimate.manifestLabel);
      onClose();
    });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('assistantJob.title')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {t('assistantJob.intro')}
          </Typography>
          <TextField
            select
            size="small"
            label={t('assistantJob.manifest')}
            value={manifestId}
            onChange={(e) => {
              setManifestId(e.target.value);
              setEstimate(null);
            }}
          >
            {manifests.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={t('assistantJob.instructions')}
            placeholder={t('assistantJob.instructionsPlaceholder')}
            value={instructions}
            onChange={(e) => {
              setInstructions(e.target.value);
              setEstimate(null);
            }}
            multiline
            minRows={3}
            slotProps={{ htmlInput: { maxLength: 4000 } }}
          />
          {estimate && (
            <Stack spacing={1} data-testid="job-estimate">
              <Stack direction="row" spacing={1}>
                <TextField
                  select
                  size="small"
                  fullWidth
                  label={t('assistantJob.from')}
                  value={from}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setFrom(value);
                    if (to < value) setTo(value);
                  }}
                >
                  {estimate.canvases.map((c, i) => (
                    <MenuItem key={c.id} value={i}>
                      {c.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  fullWidth
                  label={t('assistantJob.to')}
                  value={to}
                  onChange={(e) => setTo(Number(e.target.value))}
                >
                  {estimate.canvases.map((c, i) => (
                    <MenuItem key={c.id} value={i} disabled={i < from}>
                      {c.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Alert severity="info">
                {t('assistantJob.estimate', {
                  count: selected.length,
                  cost: cost.toFixed(2),
                })}
              </Alert>
            </Stack>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        {busy && <CircularProgress size={20} sx={{ mr: 1 }} />}
        <Button onClick={onClose}>{t('assistant.no')}</Button>
        {estimate ? (
          <Button variant="contained" disabled={busy} onClick={doStart}>
            {t('assistantJob.start', {
              count: selected.length,
              cost: cost.toFixed(2),
            })}
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={busy || !manifestId || !instructions.trim()}
            onClick={doEstimate}
          >
            {t('assistantJob.estimateButton')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
