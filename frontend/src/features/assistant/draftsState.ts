/**
 * "Show drafts" switch, per project, kept in localStorage and shared between
 * Mirador plugins, the annotation adapter and the assistant panel.
 */
type Listener = () => void;

const listeners = new Set<Listener>();
const key = (projectId: number) => `mmu.showDrafts.${projectId}`;

export function getShowDrafts(projectId: number): boolean {
  try {
    // Shown by default to editors: drafts are what they need to review.
    return localStorage.getItem(key(projectId)) !== 'false';
  } catch {
    return true;
  }
}

export function setShowDrafts(projectId: number, value: boolean) {
  try {
    localStorage.setItem(key(projectId), String(value));
  } catch {
    // Private mode: the switch only lasts for the page.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeShowDrafts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Annotation fields MMU adds to drafts, shared with mirador-video and MAEV. */
export const DRAFT_MARKER = {
  property: 'mmu:status',
  value: 'draft',
  modelProperty: 'mmu:model',
  batchProperty: 'mmu:batchId',
};
