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
vi.mock('./api.ts', async () => {
  const actual = await vi.importActual<object>('./api.ts');
  return {
    ...actual,
    streamChat: vi.fn(),
    getHistory: vi.fn(async () => ({ messages: [] })),
    getMyUsage: vi.fn(async () => null),
    getModels: vi.fn(async () => null),
    giveFeedback: vi.fn(async () => ({})),
    getUsageSummary: vi.fn(async () => ({
      from: '2026-11-01',
      to: '2026-11-30',
      totals: {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        tokens: 0,
        costUsd: 0,
        answers: 0,
        apiCalls: 0,
        cacheHitRate: 0,
      },
      byDay: [],
      byModel: [],
      byUser: [],
      byProject: [],
    })),
    getFeedback: vi.fn(),
  };
});

import * as api from './api.ts';
import { AnswerFeedback } from './components/AnswerFeedback.tsx';
import { AssistantPanel } from './components/AssistantPanel.tsx';
import { AssistantUsageDashboard } from './components/AssistantUsageDashboard.tsx';

describe('AnswerFeedback', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends a thumbs up', async () => {
    render(<AnswerFeedback runId="r1" />);
    fireEvent.click(screen.getByLabelText('assistantFeedback.up'));
    await screen.findByText('assistantFeedback.thanks');
    expect(api.giveFeedback).toHaveBeenCalledWith('r1', 'up', undefined);
  });

  it('sends a thumbs down at once, then the comment', async () => {
    render(<AnswerFeedback runId="r1" />);
    fireEvent.click(screen.getByLabelText('assistantFeedback.down'));
    await waitFor(() =>
      expect(api.giveFeedback).toHaveBeenCalledWith('r1', 'down', undefined),
    );
    fireEvent.change(screen.getByLabelText('assistantFeedback.comment'), {
      target: { value: 'Wrong date.' },
    });
    fireEvent.click(screen.getByText('assistantFeedback.send'));
    await waitFor(() =>
      expect(api.giveFeedback).toHaveBeenLastCalledWith(
        'r1',
        'down',
        'Wrong date.',
      ),
    );
    await screen.findByText('assistantFeedback.thanks');
  });

  it('says so when the feedback could not be sent', async () => {
    vi.mocked(api.giveFeedback).mockRejectedValueOnce(new Error('500'));
    render(<AnswerFeedback runId="r1" />);
    fireEvent.click(screen.getByLabelText('assistantFeedback.up'));
    expect(
      await screen.findByText('assistant.actionFailed'),
    ).toBeInTheDocument();
  });
});

describe('feedback in the panel', () => {
  it('offers feedback under each answer, for its run', async () => {
    vi.mocked(api.streamChat).mockImplementation(async (_body, onEvent) => {
      onEvent({ type: 'run', runId: 'run-42', conversationId: 1, model: 'm' });
      onEvent({ type: 'text', delta: 'Here.' });
      onEvent({ type: 'done', stopReason: 'end_turn' });
    });
    render(
      <AssistantPanel
        projectId={7}
        viewer={{
          store: {
            dispatch: vi.fn(),
            getState: () => ({ windows: {}, workspace: { windowIds: [] } }),
          },
        }}
        language="en"
        onClose={() => undefined}
      />,
    );
    fireEvent.change(screen.getByLabelText('assistant.placeholder'), {
      target: { value: 'hi' },
    });
    fireEvent.click(screen.getByLabelText('assistant.send'));
    const bar = await screen.findByTestId('answer-feedback');
    fireEvent.click(within(bar).getByLabelText('assistantFeedback.up'));
    await waitFor(() =>
      expect(api.giveFeedback).toHaveBeenCalledWith('run-42', 'up', undefined),
    );
  });
});

describe('feedback in the usage dashboard', () => {
  it('lists the feedback of the period, with counts', async () => {
    vi.mocked(api.getFeedback).mockResolvedValue({
      from: '2026-11-01',
      to: '2026-11-30',
      up: 3,
      down: 1,
      items: [
        {
          runId: 'r1',
          rating: 'down',
          comment: 'Wrong date.',
          userId: 3,
          userName: 'alice',
          projectId: 9,
          projectTitle: 'Codex Xolotl',
          model: 'claude-opus-5-5',
          createdAt: '2026-11-20T10:00:00Z',
        },
      ],
    });
    render(<AssistantUsageDashboard />);
    const table = await screen.findByRole('table', {
      name: 'assistantFeedback.tableLabel',
    });
    expect(table).toHaveTextContent('Wrong date.');
    expect(table).toHaveTextContent('alice (#3)');
    expect(table).toHaveTextContent('Codex Xolotl (#9)');
    expect(screen.getByText('assistantFeedback.title')).toBeInTheDocument();
  });

  it('shows no feedback section when the assistant has no feedback route', async () => {
    vi.mocked(api.getFeedback).mockRejectedValue(new Error('404'));
    render(<AssistantUsageDashboard />);
    await waitFor(() => expect(api.getUsageSummary).toHaveBeenCalled());
    await waitFor(() => expect(api.getFeedback).toHaveBeenCalled());
    expect(
      screen.queryByRole('table', { name: 'assistantFeedback.tableLabel' }),
    ).toBeNull();
  });
});
