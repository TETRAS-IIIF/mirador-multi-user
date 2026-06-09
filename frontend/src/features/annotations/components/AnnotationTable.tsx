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
  TableSortLabel,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAnnotationId } from '../annotationUtils.ts';
import { AnnotationTableRow } from './AnnotationTableRow';
import { Annotation, AnnotationBody } from '../hooks/useAnnotationFilters.ts';

enum SortableColumn {
  Project = 'project',
  Date = 'date',
  Creator = 'creator',
  Motivation = 'motivation',
  Content = 'content',
  Tags = 'tags',
}

type SortDirection = 'asc' | 'desc';

interface SortState {
  column: SortableColumn | null;
  direction: SortDirection;
}

interface ColumnDef {
  id: SortableColumn;
  labelKey: string;
  sx?: object;
  getValue: (anno: Annotation) => string;
}

interface AnnotationTableProps {
  annotations: Annotation[];
  loading: boolean;
  selected: Set<string>;
  searchQuery: string;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onToggleSelectAll: () => void;
  onToggleSelect: (id: string) => void;
}

const getBodyValue = (body?: AnnotationBody | AnnotationBody[]): string => {
  if (!body) return '';
  const first = Array.isArray(body) ? body[0] : body;
  return first?.value ?? '';
};

const parseDate = (dateStr: string): number => {
  if (!dateStr) return 0;
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('/');
  const [hours, minutes] = (timePart ?? '00:00').split(':');
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
  ).getTime();
};

const COLUMNS: ColumnDef[] = [
  {
    id: SortableColumn.Project,
    labelKey: 'annotations.project',
    getValue: (anno) => anno.projectName ?? String(anno.projectId ?? ''),
  },
  {
    id: SortableColumn.Date,
    labelKey: 'annotations.date',
    sx: { minWidth: 120 },
    getValue: (anno) => anno.creationDate ?? '',
  },
  {
    id: SortableColumn.Creator,
    labelKey: 'annotations.creator',
    getValue: (anno) => anno.creator ?? '',
  },
  {
    id: SortableColumn.Motivation,
    labelKey: 'annotations.motivation',
    getValue: (anno) => anno.motivation ?? '',
  },
  {
    id: SortableColumn.Content,
    labelKey: 'annotations.content',
    sx: { width: '40%' },
    getValue: (anno) => getBodyValue(anno.body),
  },
  {
    id: SortableColumn.Tags,
    labelKey: 'annotations.tags',
    sx: { width: '20%' },
    getValue: () => '',
  },
];

const COLUMN_MAP = new Map(COLUMNS.map((col) => [col.id, col]));

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

  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: 'asc',
  });

  const handleSort = (column: SortableColumn) => {
    setSortState((prev) => ({
      column,
      direction:
        prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedAnnotations = useMemo(() => {
    if (!sortState.column) return annotations;

    const col = COLUMN_MAP.get(sortState.column);
    if (!col) return annotations;

    return [...annotations].sort((a, b) => {
      let comparison = 0;

      if (sortState.column === SortableColumn.Date) {
        comparison =
          parseDate(a.creationDate ?? '') - parseDate(b.creationDate ?? '');
      } else {
        const aVal = col.getValue(a).toLowerCase();
        const bVal = col.getValue(b).toLowerCase();
        comparison = aVal.localeCompare(bVal);
      }

      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [annotations, sortState]);

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
            {COLUMNS.map(({ id, labelKey, sx }) => (
              <TableCell key={id} sx={sx}>
                <TableSortLabel
                  active={sortState.column === id}
                  direction={
                    sortState.column === id ? sortState.direction : 'asc'
                  }
                  onClick={() => handleSort(id)}
                >
                  {t(labelKey)}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : sortedAnnotations.length > 0 ? (
            sortedAnnotations.map((anno, index) => {
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
