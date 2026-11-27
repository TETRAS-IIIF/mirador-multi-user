import storage from '../../../utils/storage.ts';

/** One annotation as returned by the per-annotation routes. */
export type AnnotationRow = {
  id: string;
  rowId: number;
  projectId: number;
  annotationPageId: string;
  status: 'draft' | 'published';
  origin: 'human' | 'ai';
  batchId: number | null;
  model: string | null;
  editedByHuman: boolean;
  content: Record<string, unknown>;
};

export type AnnotationFilter = {
  projectId: number;
  annotationPageId?: string;
  status?: 'draft' | 'published';
  origin?: 'human' | 'ai';
  batchId?: number;
};

export class AnnotationApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const base = () => `${import.meta.env.VITE_BACKEND_URL}/annotation`;

const query = (
  filter: AnnotationFilter,
  extra: Record<string, string> = {},
) => {
  const params = new URLSearchParams(extra);
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.set(key, String(value));
  });
  return params.toString();
};

const call = async <T>(url: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${storage.getToken()}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new AnnotationApiError(
      response.status,
      `${init.method ?? 'GET'} ${url} failed (${response.status}) ${detail}`,
    );
  }
  return response.json();
};

const one = (projectId: number, annotationId: string) =>
  `${base()}/${projectId}/${encodeURIComponent(annotationId)}`;

export const createAnnotation = (dto: {
  projectId: number;
  annotationPageId: string;
  content: Record<string, unknown>;
}) =>
  call<AnnotationRow>(base(), { method: 'POST', body: JSON.stringify(dto) });

export const updateAnnotation = (
  projectId: number,
  annotationId: string,
  dto: {
    content?: Record<string, unknown>;
    status?: 'draft' | 'published';
    /** The `mmu:version` loaded: 409 if someone else saved since. */
    expectedVersion?: string;
  },
) =>
  call<AnnotationRow>(one(projectId, annotationId), {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });

export const deleteAnnotation = (projectId: number, annotationId: string) =>
  call<{ deleted: number }>(one(projectId, annotationId), { method: 'DELETE' });

export const acceptAnnotation = (projectId: number, annotationId: string) =>
  call<AnnotationRow>(`${one(projectId, annotationId)}/accept`, {
    method: 'POST',
  });

export const acceptAnnotations = (filter: AnnotationFilter) =>
  call<{ accepted: number }>(`${base()}/accept?${query(filter)}`, {
    method: 'POST',
  });

export const deleteAnnotations = (filter: AnnotationFilter) =>
  call<{ deleted: number }>(`${base()}?${query(filter)}`, { method: 'DELETE' });

export const countAnnotations = (filter: AnnotationFilter) =>
  call<{ count: number }>(`${base()}/count?${query(filter)}`);

/** Count per canvas page id, e.g. drafts to review on each canvas. */
export const countAnnotationsByPage = (filter: AnnotationFilter) =>
  call<Record<string, number>>(
    `${base()}/count?${query(filter, { groupBy: 'page' })}`,
  );

/** Annotations of a project matching the filter, oldest first. */
export const listAnnotations = (filter: AnnotationFilter) =>
  call<AnnotationRow[]>(`${base()}?${query(filter)}`);

/** An assistant run (or other job) that wrote drafts. */
export type AnnotationBatch = {
  id: number;
  projectId: number;
  kind: string;
  model: string;
  instructions: string | null;
  status: string;
  createdAt: string;
};

/** Batches of a project, newest first. */
export const listBatches = (projectId: number) =>
  call<AnnotationBatch[]>(
    `${import.meta.env.VITE_BACKEND_URL}/annotation-batch?projectId=${projectId}`,
  );
