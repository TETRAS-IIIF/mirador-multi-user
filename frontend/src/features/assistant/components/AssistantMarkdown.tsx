import { useMemo } from 'react';
import { Box } from '@mui/material';
import { markdownToHtml } from '../markdown.ts';

/** An assistant answer, rendered from Markdown (sanitized, see markdown.ts). */
export function AssistantMarkdown({ text }: { text: string }) {
  const html = useMemo(() => markdownToHtml(text), [text]);
  return (
    <Box
      data-testid="assistant-text"
      // Sanitized in markdownToHtml.
      dangerouslySetInnerHTML={{ __html: html }}
      sx={(theme) => ({
        ...theme.typography.body2,
        overflowWrap: 'anywhere',
        '& > :first-of-type': { mt: 0 },
        '& > :last-child': { mb: 0 },
        '& p': { my: 0.75 },
        '& h1, & h2, & h3, & h4': {
          ...theme.typography.subtitle2,
          fontWeight: 600,
          mt: 1.5,
          mb: 0.5,
        },
        '& ul, & ol': { my: 0.75, pl: 2.5 },
        '& li': { my: 0.25 },
        '& a': { color: theme.palette.primary.main },
        '& code': {
          fontFamily: 'monospace',
          fontSize: '0.85em',
          bgcolor: theme.palette.action.hover,
          px: 0.5,
          borderRadius: 0.5,
        },
        '& pre': {
          bgcolor: theme.palette.action.hover,
          p: 1,
          borderRadius: 1,
          overflowX: 'auto',
          '& code': { bgcolor: 'transparent', p: 0 },
        },
        '& blockquote': {
          my: 0.75,
          pl: 1.5,
          borderLeft: `3px solid ${theme.palette.divider}`,
          color: theme.palette.text.secondary,
        },
        '& table': {
          borderCollapse: 'collapse',
          display: 'block',
          overflowX: 'auto',
          my: 0.75,
        },
        '& th, & td': {
          border: `1px solid ${theme.palette.divider}`,
          px: 0.75,
          py: 0.25,
          textAlign: 'left',
        },
        '& hr': { border: 0, borderTop: `1px solid ${theme.palette.divider}` },
      })}
    />
  );
}
