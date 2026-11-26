import type { AssistantEvent } from './api.ts';

const labelOf = (label: unknown): string => {
  if (!label) return '';
  if (typeof label === 'string') return label;
  if (Array.isArray(label)) return label.map(labelOf).join(' ');
  if (typeof label === 'object') {
    const map = label as Record<string, unknown>;
    if ('@value' in map) return String(map['@value']);
    const values = map.none ?? map.en ?? Object.values(map)[0];
    return labelOf(values);
  }
  return String(label);
};

/** Manifests loaded in Mirador (the project's workspace), with their label. */
export function workspaceManifests(viewer: {
  store?: { getState: () => { manifests?: Record<string, unknown> } };
}) {
  const manifests = viewer?.store?.getState()?.manifests ?? {};
  return Object.entries(
    manifests as Record<string, { json?: { label?: unknown } }>,
  )
    .filter(([, m]) => m?.json)
    .map(([id, m]) => ({ id, label: labelOf(m.json?.label) || id }));
}

/** What the panel shows of a background job. */
export type JobState = {
  runId: string;
  title: string;
  done: number;
  total: number;
  /** Canvas being annotated. */
  label?: string;
  drafts: number;
  finished: boolean;
  stopReason: string | null;
  error?: string;
};

export const newJob = (runId: string, title: string): JobState => ({
  runId,
  title,
  done: 0,
  total: 0,
  drafts: 0,
  finished: false,
  stopReason: null,
});

/** The job after one of its events. */
export function applyJobEvent(job: JobState, event: AssistantEvent): JobState {
  switch (event.type) {
    case 'progress':
      return {
        ...job,
        done: event.done,
        total: event.total,
        label: event.label,
      };
    case 'draft':
      return { ...job, drafts: job.drafts + 1 };
    case 'error':
      return { ...job, error: event.message };
    case 'done':
      return { ...job, finished: true, stopReason: event.stopReason };
    default:
      return job;
  }
}
