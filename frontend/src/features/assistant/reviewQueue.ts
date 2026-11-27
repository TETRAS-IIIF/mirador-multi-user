/* eslint-disable @typescript-eslint/no-explicit-any -- Mirador's Redux state is untyped */

/** Canvas of an MMU annotation page id (`<canvas>/annotationPage`). */
export const canvasOfPage = (annotationPageId: string) =>
  annotationPageId.replace(/\/annotationPage$/, '');

const labelText = (label: any): string => {
  if (!label) return '';
  if (typeof label === 'string') return label;
  if (Array.isArray(label))
    return label
      .map((l) => (typeof l === 'string' ? l : (l?.['@value'] ?? '')))
      .join(' ');
  const values = label.none ?? label.en ?? Object.values(label)[0];
  return Array.isArray(values) ? values.join(' ') : String(values ?? '');
};

/** A canvas's label from the manifests loaded in Mirador, else the end of its id. */
export function canvasLabel(
  viewer: { store?: { getState: () => any } } | undefined,
  canvasId: string,
): string {
  const manifests = viewer?.store?.getState()?.manifests ?? {};
  for (const manifest of Object.values<any>(manifests)) {
    const json = manifest?.json;
    const canvases = json?.items ?? json?.sequences?.[0]?.canvases ?? [];
    const canvas = canvases.find(
      (c: any) => (c?.id ?? c?.['@id']) === canvasId,
    );
    if (canvas) {
      const label = labelText(canvas.label);
      if (label) return label;
    }
  }
  return canvasId.split('/').filter(Boolean).pop() ?? canvasId;
}
