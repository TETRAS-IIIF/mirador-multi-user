import { Box, Chip, Typography } from '@mui/material';
import { HighlightText } from './HighlightText';

interface AnnotationBodyTagsProps {
  body: any;
  searchQuery: string;
}

export const AnnotationBodyTags = ({
  body,
  searchQuery,
}: AnnotationBodyTagsProps) => {
  if (!body) return null;

  const bodyArray = Array.isArray(body) ? body : [body];
  const tagItems = bodyArray.filter((b: any) => b?.purpose === 'tagging');

  if (tagItems.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        -
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {tagItems.map((tag, i) => (
        <Chip
          key={i}
          label={
            <HighlightText
              text={tag.value || tag.id || 'Tag'}
              highlight={searchQuery}
            />
          }
          size="small"
          color="primary"
          variant="outlined"
        />
      ))}
    </Box>
  );
};
