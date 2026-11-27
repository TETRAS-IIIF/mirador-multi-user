/**
 * Editing a draft's text and tags in the assistant panel. The text is plain:
 * paragraphs separated by a blank line, line breaks kept, as the assistant
 * writes it (mmu-agents-backend `textToHtml`).
 */
type Body = { purpose?: string; value?: unknown; [key: string]: unknown };

const bodiesOf = (content: Record<string, unknown>): Body[] => {
  const body = content.body as Body | Body[] | undefined;
  if (Array.isArray(body)) return body;
  return body ? [body] : [];
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Plain text to the HTML the assistant writes: <p> per paragraph, <br> per line. */
export const textToHtml = (text: string) =>
  text
    .trim()
    .split(/\n{2,}/)
    .filter((p) => p.trim() !== '')
    .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');

/** HTML to plain text, keeping paragraphs (blank line) and line breaks. */
export function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  const blocks = Array.from(
    doc.body.querySelectorAll('p, li, h1, h2, h3, h4, div'),
  ).filter((el) => !el.querySelector('p, li, div'));
  const text = blocks.length
    ? blocks.map((el) => el.textContent ?? '').join('\n\n')
    : (doc.body.textContent ?? '');
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

/** True when the HTML has formatting that plain-text editing would drop. */
export const hasRichFormatting = (html: string) =>
  /<(?!\/?(p|br)\b)[a-z]/i.test(html);

/** The describing body's HTML and the tags of an annotation. */
export function editableParts(content: Record<string, unknown>) {
  const bodies = bodiesOf(content);
  const describing = bodies.find((b) => b?.purpose !== 'tagging');
  const html = String(describing?.value ?? '');
  return {
    html,
    text: htmlToText(html),
    tags: bodies
      .filter((b) => b?.purpose === 'tagging')
      .map((b) => String(b.value)),
  };
}

/**
 * The annotation with new text and tags. Everything else (target, generator,
 * other bodies' fields, id...) is kept.
 */
export function withEditedContent(
  content: Record<string, unknown>,
  text: string,
  tags: string[],
): Record<string, unknown> {
  const bodies = bodiesOf(content);
  const describing = bodies.find((b) => b?.purpose !== 'tagging');
  const cleanTags = [...new Set(tags.map((t) => t.trim()).filter(Boolean))];
  return {
    ...content,
    body: [
      {
        type: 'TextualBody',
        format: 'text/html',
        ...describing,
        purpose: describing?.purpose ?? 'describing',
        value: textToHtml(text),
      },
      ...cleanTags.map((value) => ({
        type: 'TextualBody',
        purpose: 'tagging',
        value,
      })),
    ],
  };
}
