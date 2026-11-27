import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

vi.mock('mirador', () => ({
  addCompanionWindow: () => ({ type: 'ADD_CW' }),
  hoverAnnotation: () => ({ type: 'HOVER' }),
  receiveAnnotation: () => ({ type: 'RECEIVE' }),
  setCanvas: () => ({ type: 'SET_CANVAS' }),
  OSDReferences: { get: () => undefined },
}));
vi.mock('../mirador/api/gettingAnnotationPage.ts', () => ({
  gettingAnnotationPage: vi.fn(async () => []),
}));
vi.mock('react-hot-toast', () => {
  const toast = Object.assign(vi.fn(), { success: vi.fn() });
  return { default: toast };
});
vi.mock('./api.ts', async () => {
  const actual = await vi.importActual<object>('./api.ts');
  return {
    ...actual,
    streamChat: vi.fn(),
    getHistory: vi.fn(async () => ({ messages: [] })),
    getMyUsage: vi.fn(async () => null),
    getModels: vi.fn(async () => null),
    listRuns: vi.fn(async () => []),
    followRun: vi.fn(async () => undefined),
    stopRun: vi.fn(async () => ({})),
    estimateJob: vi.fn(),
    startJob: vi.fn(),
  };
});

import toast from 'react-hot-toast';
import * as api from './api.ts';
import { applyJobEvent, newJob, workspaceManifests } from './jobs.ts';
import { JobDialog } from './components/JobDialog.tsx';
import { AssistantPanel } from './components/AssistantPanel.tsx';

const MANIFEST = 'https://example.org/manifest.json';
const C1 = 'https://example.org/canvas/1';

const viewer = {
  store: {
    dispatch: vi.fn(),
    getState: () => ({
      manifests: {
        [MANIFEST]: { json: { label: { en: ['Codex Xolotl'] } } },
        'https://example.org/loading.json': { isFetching: true },
      },
      windows: { w1: { manifestId: MANIFEST, canvasId: C1 } },
      workspace: { windowIds: ['w1'], focusedWindowId: 'w1' },
    }),
  },
};

const estimate = {
  model: 'claude-opus-5-5',
  manifestLabel: 'Codex Xolotl',
  canvases: [
    { id: C1, label: 'f. 1' },
    { id: 'https://example.org/canvas/2', label: 'f. 2' },
    { id: 'https://example.org/canvas/3', label: 'f. 3' },
  ],
  perCanvasUsd: 0.5,
  costUsd: 1.5,
};

/** Picks a value in an MUI select (TextField select). */
const choose = (label: string, option: string) => {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: label }));
  fireEvent.click(within(screen.getByRole('listbox')).getByText(option));
};

describe('job helpers', () => {
  it('lists the manifests loaded in Mirador, with their label', () => {
    expect(workspaceManifests(viewer)).toEqual([
      { id: MANIFEST, label: 'Codex Xolotl' },
    ]);
  });

  it('follows a job from its events', () => {
    let job = newJob('r1', 'Codex');
    job = applyJobEvent(job, {
      type: 'progress',
      done: 1,
      total: 3,
      label: 'f. 2',
    });
    job = applyJobEvent(job, {
      type: 'draft',
      annotationId: 'a',
      annotationPageId: 'p',
      canvasId: C1,
      batchId: 1,
      annotation: {},
      cropUrl: null,
    });
    job = applyJobEvent(job, { type: 'done', stopReason: 'cancelled' });
    expect(job).toMatchObject({
      done: 1,
      total: 3,
      label: 'f. 2',
      drafts: 1,
      finished: true,
      stopReason: 'cancelled',
    });
  });
});

describe('JobDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.estimateJob).mockResolvedValue(estimate);
    vi.mocked(api.startJob).mockResolvedValue({ runId: 'job-1' });
  });

  const renderDialog = (onStarted = vi.fn(), onClose = vi.fn()) => {
    render(
      <JobDialog
        open
        onClose={onClose}
        projectId={7}
        viewer={viewer}
        model="claude-haiku-5-5"
        language="fr"
        onStarted={onStarted}
      />,
    );
    return { onStarted, onClose };
  };

  it('estimates, lets the user pick a range, then starts the job', async () => {
    const { onStarted, onClose } = renderDialog();
    fireEvent.change(screen.getByLabelText('assistantJob.instructions'), {
      target: { value: 'Tag dates' },
    });
    fireEvent.click(screen.getByText('assistantJob.estimateButton'));
    await screen.findByTestId('job-estimate');
    expect(api.estimateJob).toHaveBeenCalledWith({
      projectId: 7,
      manifestId: MANIFEST,
      instructions: 'Tag dates',
      language: 'fr',
      model: 'claude-haiku-5-5',
    });
    // Only f. 2 and f. 3: 2 canvases, $1.00.
    choose('assistantJob.from', 'f. 2');
    expect(
      screen.getByRole('button', { name: /assistantJob.start/ }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /assistantJob.start/ }));
    await waitFor(() =>
      expect(onStarted).toHaveBeenCalledWith('job-1', 'Codex Xolotl'),
    );
    expect(vi.mocked(api.startJob).mock.calls[0][0]).toMatchObject({
      canvasIds: [
        'https://example.org/canvas/2',
        'https://example.org/canvas/3',
      ],
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('sends no canvas list for the whole manifest', async () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText('assistantJob.instructions'), {
      target: { value: 'x' },
    });
    fireEvent.click(screen.getByText('assistantJob.estimateButton'));
    await screen.findByTestId('job-estimate');
    fireEvent.click(screen.getByRole('button', { name: /assistantJob.start/ }));
    await waitFor(() => expect(api.startJob).toHaveBeenCalled());
    expect(vi.mocked(api.startJob).mock.calls[0][0].canvasIds).toBeUndefined();
  });

  it("shows the assistant's message when it refuses", async () => {
    vi.mocked(api.estimateJob).mockRejectedValue(
      new api.AssistantRequestError('No canvas to annotate in this manifest.'),
    );
    renderDialog();
    fireEvent.change(screen.getByLabelText('assistantJob.instructions'), {
      target: { value: 'x' },
    });
    fireEvent.click(screen.getByText('assistantJob.estimateButton'));
    expect(
      await screen.findByText('No canvas to annotate in this manifest.'),
    ).toBeInTheDocument();
  });
});

describe('panel and background runs', () => {
  beforeEach(() => vi.clearAllMocks());

  const renderPanel = () =>
    render(
      <AssistantPanel
        projectId={7}
        viewer={viewer}
        language="en"
        onClose={() => undefined}
      />,
    );

  it('follows a running job found on open, until it ends', async () => {
    vi.mocked(api.listRuns).mockResolvedValue([
      {
        runId: 'job-1',
        kind: 'job',
        title: 'Codex Xolotl',
        startedAt: '',
        finished: false,
        stopReason: null,
        events: 3,
        progress: null,
      },
    ]);
    let emit: (e: api.AssistantEvent) => void = () => undefined;
    let end: () => void = () => undefined;
    vi.mocked(api.followRun).mockImplementation(
      (_id, _from, onEvent) =>
        new Promise<void>((resolve) => {
          emit = onEvent;
          end = resolve;
        }),
    );
    renderPanel();
    const job = await screen.findByTestId('assistant-job');
    expect(job).toHaveTextContent('Codex Xolotl');
    expect(api.followRun).toHaveBeenCalledWith(
      'job-1',
      0,
      expect.any(Function),
      expect.anything(),
    );

    emit({ type: 'progress', done: 1, total: 3, label: 'f. 2' });
    await waitFor(() => expect(job).toHaveTextContent('assistantJob.progress'));
    fireEvent.click(within(job).getByText('assistant.stop'));
    expect(api.stopRun).toHaveBeenCalledWith('job-1');

    emit({ type: 'done', stopReason: 'cancelled' });
    end();
    await waitFor(() =>
      expect(job).toHaveTextContent('assistantJob.stoppedShort'),
    );
    expect(toast).toHaveBeenCalledWith('assistantJob.stopped');
    fireEvent.click(within(job).getByLabelText('assistantJob.dismiss'));
    expect(screen.queryByTestId('assistant-job')).toBeNull();
  });

  it('takes over an answer still running', async () => {
    vi.mocked(api.listRuns).mockResolvedValue([
      {
        runId: 'chat-1',
        kind: 'chat',
        title: '',
        startedAt: '',
        finished: false,
        stopReason: null,
        events: 2,
        progress: null,
      },
    ]);
    vi.mocked(api.followRun).mockImplementation(async (_id, _from, onEvent) => {
      onEvent({ type: 'run', runId: 'chat-1', conversationId: 1, model: 'm' });
      onEvent({ type: 'text', delta: 'Done while you were away.' });
      onEvent({ type: 'done', stopReason: 'end_turn' });
    });
    renderPanel();
    expect(
      await screen.findByText('Done while you were away.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/assistant.resumed/)).toBeInTheDocument();
    expect(api.followRun).toHaveBeenCalledWith(
      'chat-1',
      0,
      expect.any(Function),
      expect.anything(),
    );
  });
});
