/** The user's model choice in the assistant panel, kept in localStorage. */
const KEY = 'mmu.assistant.model';

export function savedModel(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveModel(model: string) {
  try {
    localStorage.setItem(KEY, model);
  } catch {
    // Private mode: the choice only lasts for the page.
  }
}

/** The saved model when still allowed, else the instance default. */
export function pickModel(
  saved: string | null,
  allowed: { id: string }[],
  fallback: string,
): string {
  return saved && allowed.some((m) => m.id === saved) ? saved : fallback;
}
