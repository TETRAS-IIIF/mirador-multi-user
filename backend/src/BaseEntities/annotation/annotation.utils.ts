import { Annotation, AnnotationStatus } from './entities/annotation.entity';

/** Prefix of the MMU-only fields added to annotations served to MMU clients. */
export const MMU_PREFIX = 'mmu:';

/**
 * Header the assistant stack sends on every call. It can only restrict what a
 * request may do (the token is the user's own), never grant more.
 */
export const ASSISTANT_CLIENT_HEADER = 'x-mmu-client';
export const ASSISTANT_CLIENT_VALUE = 'assistant';

export const isAssistantRequest = (request: any): boolean =>
  String(request?.headers?.[ASSISTANT_CLIENT_HEADER] ?? '').toLowerCase() ===
  ASSISTANT_CLIENT_VALUE;

/** Returns a shallow copy of a W3C annotation without its `mmu:` fields. */
export function stripMmuFields<T extends Record<string, any>>(content: T): T {
  if (!content || typeof content !== 'object') return content;
  const copy: Record<string, any> = {};
  for (const [key, value] of Object.entries(content)) {
    if (!key.startsWith(MMU_PREFIX)) copy[key] = value;
  }
  return copy as T;
}

/**
 * The annotation as MMU clients see it. Drafts carry `mmu:` fields so that
 * Mirador and the annotation editor can tell them apart.
 */
export function toClientAnnotation(row: Annotation): Record<string, any> {
  const content = {
    ...stripMmuFields(row.content ?? {}),
    id: row.annotationId,
  };
  if (row.status !== AnnotationStatus.DRAFT) return content;
  return {
    ...content,
    'mmu:status': row.status,
    'mmu:origin': row.origin,
    'mmu:batchId': row.batchId ?? null,
    'mmu:model': row.model ?? null,
  };
}

/** IIIF AnnotationPage rebuilt from rows, in insertion order. */
export function buildAnnotationPage(
  annotationPageId: string,
  rows: Annotation[],
  { forExport = false }: { forExport?: boolean } = {},
) {
  const sorted = [...rows].sort((a, b) => a.id - b.id);
  return {
    id: annotationPageId,
    type: 'AnnotationPage',
    items: sorted.map((row) =>
      forExport
        ? { ...stripMmuFields(row.content ?? {}), id: row.annotationId }
        : toClientAnnotation(row),
    ),
  };
}

/** Items of a stored page JSON, tolerant of the shapes found in old rows. */
export function pageItems(content: any): any[] {
  if (!content) return [];
  if (Array.isArray(content)) return content;
  return Array.isArray(content.items) ? content.items : [];
}

/**
 * W3C provenance on a published AI annotation: `generator` is the model
 * (a Software agent), `creator` the person who accepted it. MAE shows
 * `creator` as a plain user name, so that shape is kept.
 */
export function withAcceptProvenance(
  content: Record<string, any>,
  model: string | null,
  userName: string | undefined,
): Record<string, any> {
  const next = { ...content };
  if (model) {
    next.generator = { type: 'Software', name: model };
  }
  if (userName) {
    next.creator = userName;
    next.lastEditor = userName;
  }
  return next;
}
