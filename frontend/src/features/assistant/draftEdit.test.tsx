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
vi.mock('../mirador/api/annotationApi.ts', async () => {
  const actual = await vi.importActual<object>(
    '../mirador/api/annotationApi.ts',
  );
  return {
    ...actual,
    updateAnnotation: vi.fn(),
    acceptAnnotation: vi.fn(async () => ({})),
    deleteAnnotation: vi.fn(async () => ({})),
  };
});
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
import * as annotationApi from '../mirador/api/annotationApi.ts';
import {
  editableParts,
  hasRichFormatting,
  htmlToText,
  textToHtml,
  withEditedContent,
} from './draftEdit.ts';
import { AssistantPanel } from './components/AssistantPanel.tsx';

const CANVAS = 'https://example.org/canvas/1';

describe('draft text and tags', () => {
  it('converts plain text to the HTML the assistant writes, and back', () => {
    const text =
      'Transcription: anno <domini>\nMCCCXLII\n\nTranslation: in the year 1342';
    const html = textToHtml(text);
    expect(html).toBe(
      '<p>Transcription: anno &lt;domini&gt;<br>MCCCXLII</p><p>Translation: in the year 1342</p>',
    );
    expect(htmlToText(html)).toBe(text);
    expect(htmlToText('just text')).toBe('just text');
    expect(textToHtml('\n\none\n\n\n\ntwo\n')).toBe('<p>one</p><p>two</p>');
  });

  it('detects formatting that plain-text editing would drop', () => {
    expect(hasRichFormatting('<p>a<br>b</p>')).toBe(false);
    expect(hasRichFormatting('<p>a <strong>b</strong></p>')).toBe(true);
    expect(hasRichFormatting('<ul><li>a</li></ul>')).toBe(true);
  });

  it('replaces the text and tags, and keeps everything else', () => {
    const content = {
      id: 'a1',
      type: 'Annotation',
      motivation: 'commenting',
      generator: { type: 'Software', name: 'claude-opus-5-5' },
      target: {
        source: CANVAS,
        selector: { type: 'FragmentSelector', value: 'xywh=1,2,3,4' },
      },
      body: [
        {
          type: 'TextualBody',
          purpose: 'describing',
          format: 'text/html',
          language: 'fr',
          value: '<p>old</p>',
        },
        { type: 'TextualBody', purpose: 'tagging', value: 'date' },
      ],
    };
    const edited = withEditedContent(content, 'new\n\ntext', [
      'person',
      ' person ',
      '',
      'date',
    ]);
    expect(edited).toEqual({
      ...content,
      body: [
        {
          type: 'TextualBody',
          purpose: 'describing',
          format: 'text/html',
          language: 'fr',
          value: '<p>new</p><p>text</p>',
        },
        { type: 'TextualBody', purpose: 'tagging', value: 'person' },
        { type: 'TextualBody', purpose: 'tagging', value: 'date' },
      ],
    });
    expect(editableParts(content)).toEqual({
      html: '<p>old</p>',
      text: 'old',
      tags: ['date'],
    });
  });
});

describe('inline edit in the draft card', () => {
  const annotation = {
    id: 'd1',
    type: 'Annotation',
    motivation: 'commenting',
    target: `${CANVAS}#xywh=10,20,30,40`,
    body: [
      {
        type: 'TextualBody',
        purpose: 'describing',
        format: 'text/html',
        value: '<p>anno domini</p>',
      },
      { type: 'TextualBody', purpose: 'tagging', value: 'date' },
    ],
  };

  const viewer = {
    store: {
      dispatch: vi.fn(),
      getState: () => ({
        windows: { w1: { manifestId: 'm', canvasId: CANVAS } },
        workspace: { windowIds: ['w1'], focusedWindowId: 'w1' },
      }),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.streamChat).mockImplementation(async (_body, onEvent) => {
      onEvent({
        type: 'draft',
        annotationId: 'd1',
        annotationPageId: `${CANVAS}/annotationPage`,
        canvasId: CANVAS,
        batchId: 1,
        annotation,
        cropUrl: null,
      });
      onEvent({ type: 'done', stopReason: 'end_turn' });
    });
    vi.mocked(annotationApi.updateAnnotation).mockImplementation(
      async (_projectId, id, dto) =>
        ({ id, content: dto.content, status: 'draft' }) as never,
    );
  });

  const openCard = async () => {
    render(
      <AssistantPanel
        projectId={7}
        viewer={viewer}
        language="en"
        onClose={() => undefined}
      />,
    );
    fireEvent.change(screen.getByLabelText('assistant.placeholder'), {
      target: { value: 'annotate' },
    });
    fireEvent.click(screen.getByLabelText('assistant.send'));
    const card = await screen.findByTestId('draft-card');
    fireEvent.click(within(card).getByText('assistant.edit'));
    return within(card);
  };

  it('saves edited text and tags, keeping the draft', async () => {
    const card = await openCard();
    const text = card.getByLabelText('assistant.editText');
    expect(text).toHaveValue('anno domini');
    fireEvent.change(text, { target: { value: 'anno domini MCCCXLII' } });
    // A tag typed without pressing Enter is kept too.
    fireEvent.change(card.getByLabelText('assistant.editTags'), {
      target: { value: 'colophon' },
    });
    fireEvent.click(card.getByText('assistant.save'));
    await waitFor(() =>
      expect(annotationApi.updateAnnotation).toHaveBeenCalled(),
    );
    const [projectId, id, dto] = vi.mocked(annotationApi.updateAnnotation).mock
      .calls[0];
    expect([projectId, id]).toEqual([7, 'd1']);
    expect(dto.content).toMatchObject({
      target: annotation.target,
      body: [
        { purpose: 'describing', value: '<p>anno domini MCCCXLII</p>' },
        { purpose: 'tagging', value: 'date' },
        { purpose: 'tagging', value: 'colophon' },
      ],
    });
    expect(annotationApi.acceptAnnotation).not.toHaveBeenCalled();
    // The card shows the saved version.
    await waitFor(() =>
      expect(card.getByText('anno domini MCCCXLII')).toBeInTheDocument(),
    );
    expect(card.getByText('colophon')).toBeInTheDocument();
  });

  it('Save and accept publishes the edited draft', async () => {
    const card = await openCard();
    fireEvent.change(card.getByLabelText('assistant.editText'), {
      target: { value: 'fixed' },
    });
    fireEvent.click(card.getByText('assistant.saveAndAccept'));
    await waitFor(() =>
      expect(annotationApi.acceptAnnotation).toHaveBeenCalledWith(7, 'd1'),
    );
    expect(
      vi.mocked(annotationApi.updateAnnotation).mock.invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(annotationApi.acceptAnnotation).mock.invocationCallOrder[0],
    );
    await waitFor(() =>
      expect(card.getByText('assistant.accepted')).toBeInTheDocument(),
    );
  });

  it('Cancel changes nothing', async () => {
    const card = await openCard();
    fireEvent.change(card.getByLabelText('assistant.editText'), {
      target: { value: 'not saved' },
    });
    fireEvent.click(card.getByText('assistant.no'));
    expect(card.getByText('anno domini')).toBeInTheDocument();
    expect(annotationApi.updateAnnotation).not.toHaveBeenCalled();
  });
});
