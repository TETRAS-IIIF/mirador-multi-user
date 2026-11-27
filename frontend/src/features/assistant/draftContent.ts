/** Reading the text and tags of a W3C annotation (drafts in the panel and the review queue). */
type Body = { purpose?: string; value?: unknown };

/** Bodies of a W3C annotation, as an array. */
export const bodiesOf = (annotation: Record<string, unknown>): Body[] => {
  const body = annotation.body as Body | Body[] | undefined;
  if (Array.isArray(body)) return body;
  return body ? [body] : [];
};

/** Text of a W3C annotation's describing body, without HTML. */
export function draftText(annotation: Record<string, unknown>) {
  const describing = bodiesOf(annotation).find((b) => b?.purpose !== 'tagging');
  const html = String(describing?.value ?? '');
  return (
    new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''
  );
}

export const draftTags = (annotation: Record<string, unknown>) =>
  bodiesOf(annotation)
    .filter((b) => b?.purpose === 'tagging')
    .map((b) => String(b.value));
