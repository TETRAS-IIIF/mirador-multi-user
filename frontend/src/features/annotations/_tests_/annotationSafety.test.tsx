import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { escapeRegExp, highlightHTML } from '../annotationUtils.ts';
import { HighlightText } from '../components/HighlightText.tsx';
import { AnnotationBodyContent } from '../components/AnnotationBodyContent.tsx';
import { ModalConfirmDelete } from '../../projects/components/ModalConfirmDelete.tsx';

describe('search highlighting', () => {
  it('escapes regex characters typed in the search box', () => {
    expect(escapeRegExp('a(b)*c.d?')).toBe('a\\(b\\)\\*c\\.d\\?');
  });

  it('highlights the literal text and does not throw on an unbalanced pattern', () => {
    expect(() => highlightHTML('<p>f(x) = 1</p>', '(')).not.toThrow();
    expect(highlightHTML('<p>f(x) = 1</p>', 'f(x)')).toContain(
      '<mark style="background-color: #fff59d; padding: 0;">f(x)</mark>',
    );
    // ".": a literal dot, not "any character".
    expect(highlightHTML('<p>abc</p>', '.')).toBe('<p>abc</p>');
  });

  it('HighlightText marks the literal text', () => {
    const { container } = render(
      <HighlightText text="cost (USD)" highlight="(USD" />,
    );
    expect(container.querySelector('mark')?.textContent).toBe('(USD');
  });
});

describe('HTML from users is sanitized', () => {
  const payload =
    '<p>Hello <b>world</b><img src=x onerror="window.__xss=1"><script>window.__xss=2</script></p>';

  it('in annotation bodies', () => {
    const { container } = render(
      <AnnotationBodyContent
        body={[{ type: 'TextualBody', value: payload }]}
        searchQuery=""
      />,
    );
    expect(container.querySelector('b')?.textContent).toBe('world');
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
  });

  it('in delete confirmations, where item names are not escaped', () => {
    const { container } = render(
      <ModalConfirmDelete
        itemId={1}
        content={`Are you sure you want to delete <b>${payload}</b>?`}
        buttonLabel="Delete"
      />,
    );
    expect(container.querySelector('b')).not.toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
  });
});
