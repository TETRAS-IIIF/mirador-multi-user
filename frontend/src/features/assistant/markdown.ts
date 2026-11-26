import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Markdown from the assistant, as safe HTML. The text can echo manifest and
 * annotation content, so it is untrusted: sanitized, images left out (no
 * request to arbitrary hosts), links opened in a new tab.
 */
const purifier = DOMPurify();

purifier.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function markdownToHtml(markdown: string): string {
  const html = marked.parse(markdown, {
    async: false,
    breaks: true,
    gfm: true,
  }) as string;
  return purifier.sanitize(html, {
    FORBID_ATTR: ['style'],
    FORBID_TAGS: ['img', 'style', 'form', 'input', 'button', 'iframe'],
  });
}
