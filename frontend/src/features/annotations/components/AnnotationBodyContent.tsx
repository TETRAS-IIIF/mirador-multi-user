import React from 'react';
import { Box, Divider } from '@mui/material';
import DOMPurify from 'dompurify';
import { HighlightText } from './HighlightText';
import { highlightHTML } from '../annotationUtils.ts';

interface AnnotationBodyContentProps {
  body: any;
  searchQuery: string;
  clickable?: boolean;
}

const renderHtmlItem = (item: any, index: number, searchQuery: string) => {
  let content = '';

  if (typeof item === 'string') {
    content = item;
  } else if (item?.value) {
    content = item.value;
  } else {
    return (
      <span key={index}>
        <HighlightText
          text={item?.purpose || JSON.stringify(item)}
          highlight={searchQuery}
        />
      </span>
    );
  }

  const highlightedContent = DOMPurify.sanitize(
    highlightHTML(content, searchQuery),
  );
  return (
    <Box
      key={index}
      dangerouslySetInnerHTML={{ __html: highlightedContent }}
      sx={{
        '& p': { margin: 0 },
        '& img': { maxWidth: '100%', height: 'auto' },
      }}
    />
  );
};

export const AnnotationBodyContent = ({
  body,
  searchQuery,
  clickable = false,
}: AnnotationBodyContentProps) => {
  if (!body) return <>N/A</>;

  const bodyArray = Array.isArray(body) ? body : [body];
  const contentItems = bodyArray.filter((b: any) => b?.purpose !== 'tagging');

  if (contentItems.length === 0) return <>N/A</>;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        ...(clickable && {
          cursor: 'pointer',
          color: 'primary.main',
          '&:hover': { textDecoration: 'underline' },
        }),
      }}
    >
      {contentItems.map((b, i) => (
        <React.Fragment key={i}>
          {renderHtmlItem(b, i, searchQuery)}
          {i < contentItems.length - 1 && <Divider sx={{ my: 0.5 }} />}
        </React.Fragment>
      ))}
    </Box>
  );
};
