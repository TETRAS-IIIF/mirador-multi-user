import storage from '../../utils/storage.ts';
import { createSseParser } from './sse.ts';

/** URL of the assistant stack. Empty: the assistant is not deployed. */
export const ASSISTANT_URL: string = (
  import.meta.env.VITE_ASSISTANT_URL ?? ''
).replace(/\/+$/, '');

export const isAssistantEnabled = () => ASSISTANT_URL !== '';

export type Region = { x: number; y: number; w: number; h: number };

export type ChatContext = {
  projectId: number;
  manifestId?: string;
  canvasId?: string;
  region?: Region;
  annotationId?: string;
  language?: string;
};

/** Events streamed by the assistant (mmu-agents-backend src/assistant/events.ts). */
export type AssistantEvent =
  | { type: 'run'; runId: string; conversationId: number; model: string }
  | { type: 'text'; delta: string }
  | {
      type: 'step';
      id: string;
      label: string;
      status: 'running' | 'done' | 'error';
      detail?: string;
    }
  | {
      type: 'draft';
      annotationId: string;
      annotationPageId: string;
      canvasId: string;
      batchId: number | null;
      annotation: Record<string, unknown>;
      cropUrl: string | null;
    }
  | {
      type: 'viewer';
      callId: string;
      action: 'open_canvas' | 'zoom_to' | 'highlight';
      args: Record<string, unknown>;
    }
  | {
      type: 'confirm';
      callId: string;
      message: string;
      estimate: { drafts: number; costUsd: number };
    }
  | {
      type: 'manifest_diff';
      manifestId: string | null;
      fields: { field: string; current: unknown; suggested: unknown }[];
      canvases: { canvasId: string; label?: string; position?: number }[];
    }
  | { type: 'suggestions'; actions: string[] }
  | {
      type: 'usage';
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens: number;
      costUsd: number;
    }
  | { type: 'error'; code: string; message: string }
  | { type: 'done'; stopReason: string };

const headers = (json = true): Record<string, string> => ({
  Authorization: `Bearer ${storage.getToken()}`,
  ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const post = async (path: string, body: unknown) => {
  const response = await fetch(`${ASSISTANT_URL}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${path} failed (${response.status})`);
  return response.json();
};

/** Sends a message and calls `onEvent` for each streamed event. */
export async function streamChat(
  body: { message: string; mode?: 'careful' | 'quick'; context: ChatContext },
  onEvent: (event: AssistantEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${ASSISTANT_URL}/assistant/chat`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok || !response.body) {
    throw new Error(`The assistant answered ${response.status}`);
  }
  const parse = createSseParser((data) => onEvent(data as AssistantEvent));
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parse(decoder.decode(value, { stream: true }));
  }
}

export const stopRun = (runId: string) =>
  post(`/assistant/runs/${runId}/stop`, {});

export const addNote = (runId: string, text: string) =>
  post(`/assistant/runs/${runId}/message`, { text });

export const answerViewer = (runId: string, callId: string, result: unknown) =>
  post(`/assistant/runs/${runId}/viewer`, { callId, result });

export const answerConfirm = (
  runId: string,
  callId: string,
  approved: boolean,
) => post(`/assistant/runs/${runId}/confirm`, { callId, approved });

export const resetHistory = (projectId: number) =>
  post('/assistant/history/reset', { projectId });

export async function getHistory(projectId: number): Promise<{
  messages: { role: 'user' | 'assistant'; text: string }[];
}> {
  const response = await fetch(
    `${ASSISTANT_URL}/assistant/history?projectId=${projectId}`,
    { headers: headers(false) },
  );
  if (!response.ok) return { messages: [] };
  return response.json();
}
