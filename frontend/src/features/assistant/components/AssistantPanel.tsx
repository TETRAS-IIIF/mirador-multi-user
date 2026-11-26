import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CropFreeIcon from '@mui/icons-material/CropFree';
import { addCompanionWindow } from 'mirador';
import { useTranslation } from 'react-i18next';
import {
  addNote,
  answerConfirm,
  answerViewer,
  type AssistantEvent,
  type Region,
  type AssistantModel,
  getHistory,
  getModels,
  getMyUsage,
  resetHistory,
  stopRun,
  streamChat,
  type UsageStatus,
} from '../api.ts';
import {
  acceptAnnotation,
  deleteAnnotation,
} from '../../mirador/api/annotationApi.ts';
import { getShowDrafts } from '../draftsState.ts';
import { AnswerFeedback } from './AnswerFeedback.tsx';
import { AssistantMarkdown } from './AssistantMarkdown.tsx';
import { pickModel, saveModel, savedModel } from '../modelChoice.ts';
import {
  activeWindow,
  clearRegionOverlay,
  refreshCanvas,
  runViewerAction,
  selectRegion,
  viewerContext,
} from '../viewerBridge.ts';

type DraftEvent = Extract<AssistantEvent, { type: 'draft' }>;
type Item =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  /** Start of an answer: which model writes it. */
  | { kind: 'run'; model: string }
  /** After an answer: thumbs up / down. */
  | { kind: 'feedback'; runId: string }
  | { kind: 'step'; id: string; label: string; status: string; detail?: string }
  | {
      kind: 'draft';
      draft: DraftEvent;
      state: 'pending' | 'accepted' | 'rejected';
    }
  | {
      kind: 'confirm';
      callId: string;
      message: string;
      costUsd: number;
      answered?: boolean;
    }
  | {
      kind: 'manifest';
      diff: Extract<AssistantEvent, { type: 'manifest_diff' }>;
    }
  | { kind: 'error'; message: string };

type Body = { purpose?: string; value?: unknown };

/** Bodies of a W3C annotation, as an array. */
const bodiesOf = (annotation: Record<string, unknown>): Body[] => {
  const body = annotation.body as Body | Body[] | undefined;
  if (Array.isArray(body)) return body;
  return body ? [body] : [];
};

/** Text of a W3C annotation's describing body, without HTML. */
function draftText(annotation: Record<string, unknown>) {
  const describing = bodiesOf(annotation).find((b) => b?.purpose !== 'tagging');
  const html = String(describing?.value ?? '');
  return (
    new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''
  );
}

const draftTags = (annotation: Record<string, unknown>) =>
  bodiesOf(annotation)
    .filter((b) => b?.purpose === 'tagging')
    .map((b) => String(b.value));

interface AssistantPanelProps {
  projectId: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mirador viewer instance
  viewer: any;
  language: string;
  onClose: () => void;
}

/** Side panel to chat with the assistant about the open project. */
export function AssistantPanel({
  projectId,
  viewer,
  language,
  onClose,
}: AssistantPanelProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [costUsd, setCostUsd] = useState(0);
  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const [models, setModels] = useState<AssistantModel[]>([]);
  const [model, setModel] = useState<string | null>(null);
  // A region of the open canvas the next messages are about.
  const [regionSelection, setRegionSelection] = useState<{
    canvasId: string;
    region: Region;
  } | null>(null);
  const [selectingRegion, setSelectingRegion] = useState(false);
  const stopSelectingRef = useRef<(() => void) | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef<string | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getHistory(projectId)
      // Prepend: the user may have sent a message before history arrived.
      .then(({ messages }) =>
        setItems((prev) => [
          ...messages.map((m) => ({ kind: m.role, text: m.text }) as Item),
          ...prev,
        ]),
      )
      .catch(() => undefined);
    return () => {
      abortRef.current?.abort();
      stopSelectingRef.current?.();
    };
  }, [projectId]);

  // Models the user may pick, and their last choice when still allowed.
  useEffect(() => {
    let cancelled = false;
    getModels()
      .then((list) => {
        if (cancelled || !list) return;
        setModels(list.models);
        setModel(pickModel(savedModel(), list.models, list.default));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const chooseModel = (id: string) => {
    setModel(id);
    saveModel(id);
  };

  // The user's own usage this month: on open, then after each answer.
  useEffect(() => {
    if (running) return;
    let cancelled = false;
    getMyUsage()
      .then((status) => !cancelled && setUsage(status))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [running]);

  useEffect(() => {
    // Scroll the message list only (scrollIntoView would also scroll the page).
    const list = messagesRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [items]);

  const showDrafts = useCallback(() => getShowDrafts(projectId), [projectId]);

  const onEvent = useCallback(
    (event: AssistantEvent) => {
      switch (event.type) {
        case 'run':
          runIdRef.current = event.runId;
          setRunId(event.runId);
          setItems((prev) => [...prev, { kind: 'run', model: event.model }]);
          break;
        case 'text':
          setItems((prev) => {
            const last = prev[prev.length - 1];
            if (last?.kind === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { ...last, text: last.text + event.delta },
              ];
            }
            return [...prev, { kind: 'assistant', text: event.delta }];
          });
          break;
        case 'step':
          setItems((prev) => {
            const index = prev.findIndex(
              (i) => i.kind === 'step' && i.id === event.id,
            );
            const step: Item = { kind: 'step', ...event };
            if (index < 0) return [...prev, step];
            const next = [...prev];
            next[index] = step;
            return next;
          });
          break;
        case 'draft':
          setItems((prev) => [
            ...prev,
            { kind: 'draft', draft: event, state: 'pending' },
          ]);
          refreshCanvas(viewer, projectId, event.canvasId, showDrafts).catch(
            console.error,
          );
          break;
        case 'viewer': {
          const result = runViewerAction(viewer, event.action, event.args);
          if (runIdRef.current) {
            answerViewer(runIdRef.current, event.callId, result).catch(
              console.error,
            );
          }
          break;
        }
        case 'confirm':
          setItems((prev) => [
            ...prev,
            {
              kind: 'confirm',
              callId: event.callId,
              message: event.message,
              costUsd: event.estimate.costUsd,
            },
          ]);
          break;
        case 'manifest_diff':
          setItems((prev) => [...prev, { kind: 'manifest', diff: event }]);
          break;
        case 'suggestions':
          setSuggestions(event.actions);
          break;
        case 'usage':
          setCostUsd(event.costUsd);
          break;
        case 'error':
          setItems((prev) => [
            ...prev,
            { kind: 'error', message: event.message },
          ]);
          break;
        case 'done':
          if (runIdRef.current) {
            const answered = runIdRef.current;
            setItems((prev) => [
              ...prev,
              { kind: 'feedback', runId: answered },
            ]);
          }
          break;
      }
    },
    [viewer, projectId, showDrafts],
  );

  const toggleRegionSelection = () => {
    if (selectingRegion) {
      stopSelectingRef.current?.();
      stopSelectingRef.current = null;
      setSelectingRegion(false);
      return;
    }
    setSelectingRegion(true);
    stopSelectingRef.current = selectRegion(
      viewer,
      (selection) => {
        stopSelectingRef.current = null;
        setSelectingRegion(false);
        setRegionSelection(selection);
      },
      () => {
        stopSelectingRef.current = null;
        setSelectingRegion(false);
      },
    );
  };

  const clearRegion = () => {
    clearRegionOverlay(viewer);
    setRegionSelection(null);
  };

  /** The selected region, if the user is still on its canvas. */
  const currentRegion = (canvasId: string | undefined) =>
    regionSelection && regionSelection.canvasId === canvasId
      ? regionSelection.region
      : undefined;

  const send = async (
    message: string,
    mode: 'careful' | 'quick' = 'careful',
  ) => {
    const text = message.trim();
    if (!text || running) return;
    setInput('');
    setSuggestions([]);
    setCostUsd(0);
    setItems((prev) => [...prev, { kind: 'user', text }]);
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const window = activeWindow(viewer);
    const selected = window
      ? viewer.store.getState().windows?.[window.id]?.selectedAnnotationId
      : undefined;
    const context = viewerContext(viewer);
    const region = currentRegion(context.canvasId);
    if (regionSelection && !region) clearRegion();
    try {
      await streamChat(
        {
          message: text,
          mode,
          // "Quick" tasks keep the instance's fast model.
          ...(mode === 'careful' && model ? { model } : {}),
          context: {
            projectId,
            ...context,
            ...(region ? { region } : {}),
            ...(selected ? { annotationId: selected } : {}),
            language,
          },
        },
        onEvent,
        controller.signal,
      );
    } catch (error) {
      if (!controller.signal.aborted) {
        setItems((prev) => [
          ...prev,
          { kind: 'error', message: t('assistant.unreachable') },
        ]);
        console.error(error);
      }
    } finally {
      setRunning(false);
      setRunId(null);
      runIdRef.current = null;
    }
  };

  const stop = () => {
    if (runId) stopRun(runId).catch(() => abortRef.current?.abort());
    else abortRef.current?.abort();
  };

  const submit = () => {
    if (running) {
      if (runId && input.trim()) {
        addNote(runId, input.trim()).catch(console.error);
        setItems((prev) => [...prev, { kind: 'user', text: input.trim() }]);
        setInput('');
      }
      return;
    }
    send(input);
  };

  const setDraftState = (
    annotationId: string,
    state: 'accepted' | 'rejected',
  ) =>
    setItems((prev) =>
      prev.map((i) =>
        i.kind === 'draft' && i.draft.annotationId === annotationId
          ? { ...i, state }
          : i,
      ),
    );

  const decideDraft = async (draft: DraftEvent, accept: boolean) => {
    try {
      if (accept) await acceptAnnotation(projectId, draft.annotationId);
      else await deleteAnnotation(projectId, draft.annotationId);
      setDraftState(draft.annotationId, accept ? 'accepted' : 'rejected');
      await refreshCanvas(viewer, projectId, draft.canvasId, showDrafts);
    } catch (error) {
      console.error(error);
      setItems((prev) => [
        ...prev,
        { kind: 'error', message: t('assistant.actionFailed') },
      ]);
    }
  };

  const editDraft = (draft: DraftEvent) => {
    const window = activeWindow(viewer);
    if (!window) return;
    runViewerAction(viewer, 'open_canvas', { canvas_id: draft.canvasId });
    viewer.store.dispatch(
      addCompanionWindow(window.id, {
        annotationid: draft.annotationId,
        content: 'annotationCreation',
        position: 'right',
      }),
    );
  };

  const newChat = async () => {
    await resetHistory(projectId).catch(console.error);
    setItems([]);
    setSuggestions([]);
  };

  return (
    <Paper
      square
      elevation={3}
      data-testid="assistant-panel"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        // Fixed to the window height: only the message list scrolls, so a
        // long conversation never makes the page taller.
        height: '100vh',
        maxHeight: '100vh',
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
        flexShrink: 0,
        overflow: 'hidden',
        width: 380,
      }}
    >
      <Stack direction="row" alignItems="center" sx={{ px: 1.5, py: 1 }}>
        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
          {t('assistant.title')}
        </Typography>
        {models.length > 1 && model && (
          <Select
            size="small"
            variant="standard"
            disableUnderline
            value={model}
            disabled={running}
            onChange={(e) => chooseModel(String(e.target.value))}
            inputProps={{ 'aria-label': t('assistant.model') }}
            data-testid="assistant-model"
            sx={{ mr: 0.5, fontSize: 14 }}
          >
            {models.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.label}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 1 }}
                >
                  {'$'.repeat(m.costTier)}
                </Typography>
              </MenuItem>
            ))}
          </Select>
        )}
        <Tooltip title={t('assistant.suggestManifest')}>
          <span>
            <IconButton
              aria-label={t('assistant.suggestManifest')}
              disabled={running}
              onClick={() =>
                send(t('assistant.suggestManifestPrompt'), 'quick')
              }
            >
              <AutoFixHighIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t('assistant.newChat')}>
          <span>
            <IconButton
              aria-label={t('assistant.newChat')}
              disabled={running}
              onClick={newChat}
            >
              <RestartAltIcon />
            </IconButton>
          </span>
        </Tooltip>
        <IconButton aria-label={t('assistant.close')} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Stack>
      <Divider />
      <Box
        ref={messagesRef}
        data-testid="assistant-messages"
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          px: 1.5,
          py: 1,
        }}
      >
        {items.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {t('assistant.empty')}
          </Typography>
        )}
        <Stack spacing={1}>
          {items.map((item, index) => {
            switch (item.kind) {
              case 'user':
                return (
                  <Box
                    key={index}
                    sx={{
                      alignSelf: 'flex-end',
                      bgcolor: 'action.selected',
                      borderRadius: 2,
                      px: 1.5,
                      py: 1,
                      maxWidth: '85%',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {item.text}
                    </Typography>
                  </Box>
                );
              case 'assistant':
                return <AssistantMarkdown key={index} text={item.text} />;
              case 'feedback':
                return <AnswerFeedback key={index} runId={item.runId} />;
              case 'run':
                return (
                  <Typography
                    key={index}
                    variant="caption"
                    color="text.secondary"
                    data-testid="assistant-run-model"
                  >
                    {models.find((m) => m.id === item.model)?.label ??
                      item.model}
                  </Typography>
                );
              case 'step':
                return (
                  <Typography
                    key={index}
                    variant="caption"
                    color={item.status === 'error' ? 'error' : 'text.secondary'}
                  >
                    {item.status === 'running'
                      ? '… '
                      : item.status === 'error'
                        ? '✗ '
                        : '✓ '}
                    {item.label}
                  </Typography>
                );
              case 'draft': {
                const { draft } = item;
                return (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{ p: 1 }}
                    data-testid="draft-card"
                  >
                    <Stack spacing={1}>
                      {draft.cropUrl && (
                        <img
                          src={draft.cropUrl}
                          alt=""
                          style={{
                            maxWidth: '100%',
                            maxHeight: 160,
                            objectFit: 'contain',
                          }}
                        />
                      )}
                      <Typography variant="body2">
                        {draftText(draft.annotation)}
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        <Chip
                          size="small"
                          color="warning"
                          variant="outlined"
                          label={t('assistant.draft')}
                        />
                        {draftTags(draft.annotation).map((tag) => (
                          <Chip key={tag} size="small" label={tag} />
                        ))}
                      </Stack>
                      {item.state === 'pending' ? (
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          <Button
                            size="small"
                            color="inherit"
                            onClick={() => decideDraft(draft, false)}
                          >
                            {t('assistant.reject')}
                          </Button>
                          <Button size="small" onClick={() => editDraft(draft)}>
                            {t('assistant.edit')}
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => decideDraft(draft, true)}
                          >
                            {t('assistant.accept')}
                          </Button>
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {item.state === 'accepted'
                            ? t('assistant.accepted')
                            : t('assistant.rejected')}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                );
              }
              case 'confirm':
                return (
                  <Alert
                    key={index}
                    severity="info"
                    action={
                      item.answered ? undefined : (
                        <Stack direction="row" spacing={1}>
                          {[false, true].map((approved) => (
                            <Button
                              key={String(approved)}
                              size="small"
                              color="inherit"
                              onClick={() => {
                                if (runId)
                                  answerConfirm(
                                    runId,
                                    item.callId,
                                    approved,
                                  ).catch(console.error);
                                setItems((prev) =>
                                  prev.map((i, j) =>
                                    j === index
                                      ? { ...item, answered: true }
                                      : i,
                                  ),
                                );
                              }}
                            >
                              {approved
                                ? t('assistant.yes')
                                : t('assistant.no')}
                            </Button>
                          ))}
                        </Stack>
                      )
                    }
                  >
                    {item.message}{' '}
                    {t('assistant.estimate', { cost: item.costUsd.toFixed(2) })}
                  </Alert>
                );
              case 'manifest':
                return (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{ p: 1 }}
                    data-testid="manifest-diff"
                  >
                    <Typography variant="subtitle2">
                      {t('assistant.manifestSuggestions')}
                    </Typography>
                    {item.diff.fields.map((f) => (
                      <Box key={f.field} sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {f.field}
                        </Typography>
                        {f.current !== null &&
                          f.current !== undefined &&
                          f.current !== '' && (
                            <Typography
                              variant="body2"
                              sx={{ textDecoration: 'line-through' }}
                            >
                              {String(f.current)}
                            </Typography>
                          )}
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2" sx={{ flexGrow: 1 }}>
                            {String(f.suggested)}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() =>
                              navigator.clipboard?.writeText(
                                String(f.suggested),
                              )
                            }
                          >
                            {t('assistant.copy')}
                          </Button>
                        </Stack>
                      </Box>
                    ))}
                  </Paper>
                );
              case 'error':
                return (
                  <Alert key={index} severity="error">
                    {item.message}
                  </Alert>
                );
              default:
                return null;
            }
          })}
          {running && <CircularProgress size={18} />}
        </Stack>
      </Box>
      {suggestions.length > 0 && !running && (
        <Stack
          direction="row"
          spacing={0.5}
          flexWrap="wrap"
          sx={{ px: 1.5, pb: 1 }}
          useFlexGap
        >
          {suggestions.map((s) => (
            <Chip
              key={s}
              label={s}
              onClick={() => send(s)}
              size="small"
              variant="outlined"
            />
          ))}
        </Stack>
      )}
      <Divider />
      {(selectingRegion || regionSelection) && (
        <Stack direction="row" sx={{ px: 1.5, pt: 1 }}>
          {selectingRegion ? (
            <Typography variant="caption" color="text.secondary">
              {t('assistant.selectingRegion')}
            </Typography>
          ) : (
            regionSelection && (
              <Chip
                size="small"
                icon={<CropFreeIcon />}
                data-testid="assistant-region"
                label={t('assistant.region', {
                  x: regionSelection.region.x,
                  y: regionSelection.region.y,
                  w: regionSelection.region.w,
                  h: regionSelection.region.h,
                })}
                onDelete={clearRegion}
              />
            )
          )}
        </Stack>
      )}
      <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ p: 1.5 }}>
        <Tooltip title={t('assistant.selectRegion')}>
          <span>
            <IconButton
              aria-label={t('assistant.selectRegion')}
              aria-pressed={selectingRegion}
              color={selectingRegion || regionSelection ? 'primary' : 'default'}
              disabled={running}
              onClick={toggleRegionSelection}
            >
              <CropFreeIcon />
            </IconButton>
          </span>
        </Tooltip>
        <TextField
          fullWidth
          multiline
          maxRows={6}
          size="small"
          value={input}
          placeholder={
            running
              ? t('assistant.addWhileRunning')
              : t('assistant.placeholder')
          }
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          inputProps={{ 'aria-label': t('assistant.placeholder') }}
        />
        {running ? (
          <IconButton
            aria-label={t('assistant.stop')}
            onClick={stop}
            color="error"
          >
            <StopIcon />
          </IconButton>
        ) : (
          <IconButton
            aria-label={t('assistant.send')}
            onClick={submit}
            color="primary"
          >
            <SendIcon />
          </IconButton>
        )}
      </Stack>
      {costUsd > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ px: 1.5, pb: usage ? 0 : 1 }}
        >
          {t('assistant.cost', { cost: costUsd.toFixed(3) })}
        </Typography>
      )}
      {usage && <UsageLine usage={usage} />}
    </Paper>
  );
}

/** "This month: 120,000 tokens, about $1.40", with the quotas when set. */
function UsageLine({ usage }: { usage: UsageStatus }) {
  const { t, i18n } = useTranslation();
  const number = (n: number) => n.toLocaleString(i18n.language);
  const parts = [
    t('assistant.usageMonth', {
      tokens: number(usage.tokensThisMonth),
      cost: usage.costThisMonthUsd.toFixed(2),
    }),
  ];
  if (usage.limits.tokensPerMonth > 0) {
    parts.push(
      t('assistant.usageTokenQuota', {
        limit: number(usage.limits.tokensPerMonth),
      }),
    );
  }
  if (usage.limits.requestsPerDay > 0) {
    parts.push(
      t('assistant.usageRequestQuota', {
        used: usage.requestsToday,
        limit: usage.limits.requestsPerDay,
      }),
    );
  }
  return (
    <Typography
      variant="caption"
      color={usage.blockedReason ? 'error' : 'text.secondary'}
      sx={{ px: 1.5, pb: 1 }}
      data-testid="assistant-usage"
    >
      {parts.join(' · ')}
      {usage.blockedReason ? ` · ${usage.blockedReason}` : ''}
    </Typography>
  );
}
