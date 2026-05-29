import {
  Checkbox,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AnnotationTableRow } from './AnnotationTableRow';
import { getAnnotationId } from '../annotationUtils.ts';

interface AnnotationTableProps {
  annotations: any[];
  loading: boolean;
  selected: Set<string>;
  searchQuery: string;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onToggleSelectAll: () => void;
  onToggleSelect: (id: string) => void;
}

export const AnnotationTable = ({
  annotations,
  loading,
  selected,
  searchQuery,
  isAllSelected,
  isIndeterminate,
  onToggleSelectAll,
  onToggleSelect,
}: AnnotationTableProps) => {
  const { t } = useTranslation();

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={onToggleSelectAll}
              />
            </TableCell>
            <TableCell>{t('annotations.project')}</TableCell>
            <TableCell sx={{ minWidth: 120 }}>
              {t('annotations.date')}
            </TableCell>
            <TableCell>{t('annotations.creator')}</TableCell>
            <TableCell>{t('annotations.motivation')}</TableCell>
            <TableCell sx={{ width: '40%' }}>
              {t('annotations.content')}
            </TableCell>
            <TableCell sx={{ width: '20%' }}>{t('annotations.tags')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : annotations.length > 0 ? (
            annotations.map((anno, index) => {
              const id = getAnnotationId(anno, index);
              return (
                <AnnotationTableRow
                  key={id}
                  anno={anno}
                  id={id}
                  isSelected={selected.has(id)}
                  searchQuery={searchQuery}
                  onToggleSelect={onToggleSelect}
                />
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} align="center">
                {t('annotations.noAnnotations')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
