import { Checkbox, TableCell, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { HighlightText } from './HighlightText';
import { AnnotationBodyContent } from './AnnotationBodyContent';
import { AnnotationBodyTags } from './AnnotationBodyTags';

interface AnnotationTableRowProps {
  anno: any;
  id: string;
  isSelected: boolean;
  searchQuery: string;
  onToggleSelect: (id: string) => void;
}

export const AnnotationTableRow = ({
  anno,
  id,
  isSelected,
  searchQuery,
  onToggleSelect,
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
        <HighlightText
          text={anno.projectName || anno.projectId}
          highlight={searchQuery}
        />
      </TableCell>
      <TableCell>{anno.creationDate || 'N/A'}</TableCell>
      <TableCell>
        <HighlightText
          text={anno.creator || t('annotations.unknown')}
          highlight={searchQuery}
        />
      </TableCell>
      <TableCell>
        <HighlightText text={anno.motivation} highlight={searchQuery} />
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
