import { Checkbox, Link, TableCell, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { HighlightText } from './HighlightText';
import { AnnotationBodyContent } from './AnnotationBodyContent';
import { AnnotationBodyTags } from './AnnotationBodyTags';
import { Annotation } from '../hooks/useAnnotationFilters.ts';

interface AnnotationTableRowProps {
  anno: Annotation;
  id: string;
  isSelected: boolean;
  searchQuery: string;
  onToggleSelect: (id: string) => void;
  onProjectClick: (projectId: string | number) => void;
}

export const AnnotationTableRow = ({
  anno,
  id,
  isSelected,
  searchQuery,
  onToggleSelect,
  onProjectClick,
}: AnnotationTableRowProps) => {
  const { t } = useTranslation();

  return (
    <TableRow
      selected={isSelected}
      onClick={() => onToggleSelect(id)}
      sx={{ cursor: 'pointer' }}
    >
      <TableCell padding="checkbox">
        <Checkbox
          checked={isSelected}
          onChange={() => onToggleSelect(id)}
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      <TableCell>
        <Link
          component="button"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onProjectClick(anno.projectId);
          }}
          sx={{
            textAlign: 'left',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
          }}
        >
          <HighlightText
            text={anno.projectName! || anno.projectId.toString()!}
            highlight={searchQuery}
          />
        </Link>
      </TableCell>
      <TableCell>{anno.creationDate || 'N/A'}</TableCell>
      <TableCell>
        <HighlightText
          text={anno.creator || t('annotations.unknown')}
          highlight={searchQuery}
        />
      </TableCell>
      <TableCell>
        <HighlightText text={anno.motivation!} highlight={searchQuery} />
      </TableCell>
      <TableCell>
        <AnnotationBodyContent body={anno.body} searchQuery={searchQuery} />
      </TableCell>
      <TableCell>
        <AnnotationBodyTags body={anno.body} searchQuery={searchQuery} />
      </TableCell>
    </TableRow>
  );
};
