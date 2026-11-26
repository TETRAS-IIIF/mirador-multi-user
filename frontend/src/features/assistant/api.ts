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
  body: {
    message: string;
    mode?: 'careful' | 'quick';
    /** A model id from getModels(); overrides `mode`. */
    model?: string;
    context: ChatContext;
  },
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

/** The user's own usage this month (GET /assistant/usage). */
export type UsageStatus = {
  tokensThisMonth: number;
  requestsToday: number;
  costThisMonthUsd: number;
  limits: { tokensPerMonth: number; requestsPerDay: number };
  blockedReason: string | null;
};

export async function getMyUsage(): Promise<UsageStatus | null> {
  const response = await fetch(`${ASSISTANT_URL}/assistant/usage`, {
    headers: headers(false),
  });
  return response.ok ? response.json() : null;
}

export type UsageTotals = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  tokens: number;
  costUsd: number;
  answers: number;
  apiCalls: number;
  cacheHitRate: number;
};

/** Instance-wide usage, MMU admins only (GET /assistant/admin/usage). */
export type UsageSummary = {
  from: string;
  to: string;
  totals: UsageTotals;
  byDay: (UsageTotals & {
    day: string;
    costByModel: Record<string, number>;
  })[];
  byModel: (UsageTotals & { model: string })[];
  byUser: (UsageTotals & { userId: number; userName: string | null })[];
  byProject: (UsageTotals & {
    projectId: number;
    projectTitle: string | null;
  })[];
};

export async function getUsageSummary(
  from: string,
  to: string,
): Promise<UsageSummary> {
  const query = new URLSearchParams({ from, to });
  const response = await fetch(
    `${ASSISTANT_URL}/assistant/admin/usage?${query}`,
    { headers: headers(false) },
  );
  if (!response.ok) {
    throw new Error(`/assistant/admin/usage failed (${response.status})`);
  }
  return response.json();
}

/** A model the user may pick (GET /assistant/models). */
export type AssistantModel = {
  id: string;
  label: string;
  /** Relative cost, 1 ($) to 3 ($$$). */
  costTier: 1 | 2 | 3;
};

export async function getModels(): Promise<{
  default: string;
  models: AssistantModel[];
} | null> {
  const response = await fetch(`${ASSISTANT_URL}/assistant/models`, {
    headers: headers(false),
  });
  return response.ok ? response.json() : null;
}
