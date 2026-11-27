import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

vi.mock('../mirador/api/annotationApi.ts', () => ({
  listAnnotations: vi.fn(),
  listBatches: vi.fn(async () => []),
  acceptAnnotation: vi.fn(async () => ({})),
  deleteAnnotation: vi.fn(async () => ({ deleted: 1 })),
  acceptAnnotations: vi.fn(async () => ({})),
  deleteAnnotations: vi.fn(async () => ({})),
}));
vi.mock('./viewerBridge.ts', () => ({
  refreshCanvas: vi.fn(async () => undefined),
  runViewerAction: vi.fn(() => 'ok'),
}));

import * as annotationApi from '../mirador/api/annotationApi.ts';
import * as bridge from './viewerBridge.ts';
import { canvasLabel, canvasOfPage } from './reviewQueue.ts';
import { DraftReviewDialog } from './components/DraftReviewDialog.tsx';

const C1 = 'https://example.org/canvas/1';
const C2 = 'https://example.org/canvas/2';

const draft = (
  id: string,
  canvas: string,
  batchId: number,
  text: string,
  tags: string[],
) => ({
  id,
  rowId: 1,
  projectId: 7,
  annotationPageId: `${canvas}/annotationPage`,
  status: 'draft' as const,
  origin: 'ai' as const,
  batchId,
  model: 'claude-opus-5-5',
  editedByHuman: false,
  content: {
    body: [
      { purpose: 'describing', value: `<p>${text}</p>` },
      ...tags.map((value) => ({ purpose: 'tagging', value })),
    ],
  },
});

const viewer = {
  store: {
    getState: () => ({
      manifests: {
        m: {
          json: {
            items: [
              { id: C1, label: { en: ['folio 1r'] } },
              { id: C2, label: { none: ['folio 1v'] } },
            ],
          },
        },
      },
    }),
  },
};

const renderDialog = (onClose = vi.fn(), onChanged = vi.fn()) => {
  render(
    <DraftReviewDialog
      open
      onClose={onClose}
      projectId={7}
      viewer={viewer}
      showDrafts={() => true}
      onChanged={onChanged}
    />,
  );
  return { onClose, onChanged };
};

const items = () => screen.queryAllByTestId('review-item');

/** Picks a value in an MUI select (TextField select). */
const choose = (label: string, option: string) => {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: label }));
  fireEvent.click(within(screen.getByRole('listbox')).getByText(option));
};

describe('review queue helpers', () => {
  it('canvasOfPage and canvasLabel', () => {
    expect(canvasOfPage(`${C1}/annotationPage`)).toBe(C1);
    expect(canvasLabel(viewer, C1)).toBe('folio 1r');
    expect(canvasLabel(viewer, C2)).toBe('folio 1v');
    expect(canvasLabel(viewer, 'https://example.org/canvas/9')).toBe('9');
  });
});

describe('DraftReviewDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(annotationApi.listAnnotations).mockResolvedValue([
      draft('a', C1, 1, 'Date 1342', ['date']),
      draft('b', C1, 2, 'A king', ['person']),
      draft('c', C2, 2, 'Tenochtitlan', ['place', 'date']),
    ]);
  });

  it('lists every draft of the project, with its canvas', async () => {
    renderDialog();
    await waitFor(() => expect(items()).toHaveLength(3));
    expect(annotationApi.listAnnotations).toHaveBeenCalledWith({
      projectId: 7,
      status: 'draft',
    });
    expect(items()[2]).toHaveTextContent('Tenochtitlan');
    expect(items()[2]).toHaveTextContent('folio 1v');
  });

  it('filters by canvas, batch and tag', async () => {
    renderDialog();
    await waitFor(() => expect(items()).toHaveLength(3));
    choose('reviewQueue.tag', 'date');
    expect(items()).toHaveLength(2);
    choose('reviewQueue.canvas', 'folio 1v');
    expect(items()).toHaveLength(1);
    choose('reviewQueue.tag', 'reviewQueue.all');
    choose('reviewQueue.batch', '#2');
    expect(items()).toHaveLength(1);
    expect(items()[0]).toHaveTextContent('Tenochtitlan');
  });

  it('accepts and rejects one draft, and refreshes its canvas', async () => {
    const { onChanged } = renderDialog();
    await waitFor(() => expect(items()).toHaveLength(3));
    fireEvent.click(within(items()[0]).getByText('assistant.accept'));
    await waitFor(() => expect(items()).toHaveLength(2));
    expect(annotationApi.acceptAnnotation).toHaveBeenCalledWith(7, 'a');
    expect(bridge.refreshCanvas).toHaveBeenCalledWith(
      viewer,
      7,
      C1,
      expect.any(Function),
    );
    expect(onChanged).toHaveBeenCalled();
    fireEvent.click(within(items()[0]).getByText('assistant.reject'));
    await waitFor(() => expect(items()).toHaveLength(1));
    expect(annotationApi.deleteAnnotation).toHaveBeenCalledWith(7, 'b');
  });

  it('works from the keyboard: J / K, A, R, S', async () => {
    const { onClose } = renderDialog();
    await waitFor(() => expect(items()).toHaveLength(3));
    const list = screen.getByTestId('review-list');
    fireEvent.keyDown(list, { key: 'j' });
    expect(items()[1]).toHaveAttribute('aria-current', 'true');
    fireEvent.keyDown(list, { key: 'a' });
    await waitFor(() => expect(items()).toHaveLength(2));
    expect(annotationApi.acceptAnnotation).toHaveBeenCalledWith(7, 'b');
    fireEvent.keyDown(list, { key: 'k' });
    fireEvent.keyDown(list, { key: 'r' });
    await waitFor(() => expect(items()).toHaveLength(1));
    expect(annotationApi.deleteAnnotation).toHaveBeenCalledWith(7, 'a');
    fireEvent.keyDown(screen.getByTestId('review-list'), { key: 's' });
    expect(bridge.runViewerAction).toHaveBeenCalledWith(viewer, 'open_canvas', {
      canvas_id: C2,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('accepts the filtered list in one request after confirmation', async () => {
    renderDialog();
    await waitFor(() => expect(items()).toHaveLength(3));
    choose('reviewQueue.canvas', 'folio 1r');
    fireEvent.click(screen.getByText('reviewQueue.acceptAll'));
    expect(annotationApi.acceptAnnotations).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('reviewQueue.confirm'));
    await waitFor(() =>
      expect(annotationApi.acceptAnnotations).toHaveBeenCalledWith({
        projectId: 7,
        status: 'draft',
        annotationPageId: `${C1}/annotationPage`,
      }),
    );
  });

  it('with a tag filter, rejects exactly the listed drafts', async () => {
    renderDialog();
    await waitFor(() => expect(items()).toHaveLength(3));
    choose('reviewQueue.tag', 'date');
    fireEvent.click(screen.getByText('reviewQueue.rejectAll'));
    fireEvent.click(screen.getByText('reviewQueue.confirm'));
    await waitFor(() =>
      expect(annotationApi.deleteAnnotation).toHaveBeenCalledTimes(2),
    );
    expect(annotationApi.deleteAnnotation).toHaveBeenCalledWith(7, 'a');
    expect(annotationApi.deleteAnnotation).toHaveBeenCalledWith(7, 'c');
    expect(annotationApi.deleteAnnotations).not.toHaveBeenCalled();
  });
});
