import { describe, expect, it } from 'vitest';
import { markdownToHtml } from './markdown.ts';

const dom = (markdown: string) => {
  const el = document.createElement('div');
  el.innerHTML = markdownToHtml(markdown);
  return el;
};

describe('markdownToHtml', () => {
  it('renders the usual formatting', () => {
    const el = dom(
      '## Folio 12\n\n**Date**: *1342*\n\n- one\n- two\n\n1. first\n\n`code` and\n\n```\nblock\n```\n\n> quote',
    );
    expect(el.querySelector('h2')?.textContent).toBe('Folio 12');
    expect(el.querySelector('strong')?.textContent).toBe('Date');
    expect(el.querySelector('em')?.textContent).toBe('1342');
    expect(el.querySelectorAll('ul li')).toHaveLength(2);
    expect(el.querySelector('ol li')?.textContent).toBe('first');
    expect(el.querySelector('p code')?.textContent).toBe('code');
    expect(el.querySelector('pre code')?.textContent).toBe('block\n');
    expect(el.querySelector('blockquote')).not.toBeNull();
  });

  it('renders tables and keeps single line breaks', () => {
    const el = dom(
      '| Field | Value |\n|---|---|\n| Date | 1342 |\n\nline one\nline two',
    );
    expect(el.querySelectorAll('td')[1].textContent).toBe('1342');
    expect(el.querySelector('p br')).not.toBeNull();
  });

  it('opens links in a new tab, safely', () => {
    const link = dom('[IIIF](https://iiif.io)').querySelector('a')!;
    expect(link.getAttribute('href')).toBe('https://iiif.io');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('drops scripts, event handlers, javascript: links and images', () => {
    const el = dom(
      'Hi <script>window.x=1</script><b onclick="x()">b</b> [x](javascript:alert(1)) ![i](https://tracker.example/i.png) <img src=x onerror=alert(1)> <iframe src="https://e.org"></iframe>',
    );
    expect(el.querySelector('script, img, iframe')).toBeNull();
    expect(el.querySelector('[onclick], [onerror]')).toBeNull();
    expect(el.querySelector('a')?.getAttribute('href') ?? '').not.toMatch(
      /javascript/i,
    );
    expect(el.querySelector('b')?.textContent).toBe('b');
  });

  it('copes with half-streamed Markdown', () => {
    expect(() => markdownToHtml('**bold and ```\nunclosed')).not.toThrow();
  });
});
