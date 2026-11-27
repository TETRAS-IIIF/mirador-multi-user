import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

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
  };
});

import * as api from './api.ts';
import { uncertainty } from './uncertainty.ts';
import { AssistantPanel } from './components/AssistantPanel.tsx';

const CANVAS = 'https://example.org/canvas/1';
const describing = { purpose: 'describing', value: '<p>anno domini</p>' };

describe('uncertainty', () => {
  it("reads the assistant's assessing body, without its prefix", () => {
    expect(
      uncertainty({
        body: [
          describing,
          { purpose: 'tagging', value: 'date' },
          {
            purpose: 'assessing',
            value: 'Uncertain: the second numeral is damaged.',
          },
        ],
      }),
    ).toBe('the second numeral is damaged.');
    expect(
      uncertainty({ body: { purpose: 'assessing', value: 'Doubtful date' } }),
    ).toBe('Doubtful date');
    expect(uncertainty({ body: [describing] })).toBeNull();
    expect(
      uncertainty({ body: [{ purpose: 'assessing', value: 'Uncertain:  ' }] }),
    ).toBeNull();
  });
});

describe('draft card', () => {
  it('shows an Uncertain chip with the reason, only on uncertain drafts', async () => {
    const draft = (id: string, bodies: unknown[]) => ({
      type: 'draft' as const,
      annotationId: id,
      annotationPageId: `${CANVAS}/annotationPage`,
      canvasId: CANVAS,
      batchId: 1,
      annotation: { body: bodies },
      cropUrl: null,
    });
    vi.mocked(api.streamChat).mockImplementation(async (_body, onEvent) => {
      onEvent(
        draft('d1', [
          describing,
          {
            purpose: 'assessing',
            value: 'Uncertain: the second numeral is damaged.',
          },
        ]),
      );
      onEvent(draft('d2', [describing]));
      onEvent({ type: 'done', stopReason: 'end_turn' });
    });
    render(
      <AssistantPanel
        projectId={7}
        viewer={{
          store: {
            dispatch: vi.fn(),
            getState: () => ({
              windows: { w1: { manifestId: 'm', canvasId: CANVAS } },
              workspace: { windowIds: ['w1'], focusedWindowId: 'w1' },
            }),
          },
        }}
        language="en"
        onClose={() => undefined}
      />,
    );
    fireEvent.change(screen.getByLabelText('assistant.placeholder'), {
      target: { value: 'annotate' },
    });
    fireEvent.click(screen.getByLabelText('assistant.send'));
    const cards = await screen.findAllByTestId('draft-card');
    expect(cards).toHaveLength(2);
    const chip = within(cards[0]).getByTestId('draft-uncertain');
    expect(chip).toHaveTextContent('assistant.uncertain');
    fireEvent.mouseOver(chip);
    expect(
      await screen.findByText('the second numeral is damaged.'),
    ).toBeInTheDocument();
    expect(within(cards[1]).queryByTestId('draft-uncertain')).toBeNull();
  });
});
