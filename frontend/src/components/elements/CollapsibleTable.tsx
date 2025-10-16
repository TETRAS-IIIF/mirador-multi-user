import {
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
} from '@mui/material';
import { Row } from './Row.tsx';
import { ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RowProps } from '../../features/projects/types/types.ts';
import { PaginationControls } from './Pagination.tsx';

interface Column {
  label: string;
  align?: 'right' | 'left' | 'center';
  sortKey?: string;
}

interface CollapsibleTableProps {
  columns: Column[];
  rows: RowProps[];
  renderExpandableContent?: (data: RowProps) => ReactNode;
  onActionClick?: (row: RowProps) => void;
  labelButton?: string;
  handleCreateSnapshot?: (id: number) => void;
  itemId?: number;
}

export default function CollapsibleTable({
                                           columns,
                                           rows,
                                           renderExpandableContent,
                                           onActionClick,
                                           labelButton,
                                           itemId,
                                           handleCreateSnapshot,
                                         }: CollapsibleTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const { t } = useTranslation();

  const handleSort = (key: string | undefined) => {
    if (!key) return;

    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const filteredRows = useMemo(() => {
    const base = !filter
      ? rows
      : rows.filter((row) =>
        row.data.some((cell) =>
          String(cell.value).toLowerCase().includes(filter.toLowerCase()),
        ),
      );
    setCurrentPage(1);
    return base;
  }, [rows, filter]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const aValue = a.data.find(
        (_cell, index) => columns[index]?.sortKey === sortKey,
      )?.value;
      const bValue = b.data.find(
        (_cell, index) => columns[index]?.sortKey === sortKey,
      )?.value;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
  }, [filteredRows, sortKey, sortDirection, columns]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage]);

  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);

  return (
    <>
      <Grid container spacing={2} alignItems="center" sx={{ marginBottom: 2 }}>
  <Grid size={8}>
    <TextField
      fullWidth
  inputProps={{ maxLength: 255 }}
  label={t('filter_snapshots')}
  variant="outlined"
  value={filter}
  onChange={(e) => setFilter(e.target.value)}/>
  </Grid>
  {handleCreateSnapshot && (
    <Grid size={4}>
  <Button
    variant="contained"
    onClick={() => handleCreateSnapshot!(itemId!)}>
    {t('create_snapshot')}
    </Button>
    </Grid>
  )}
  </Grid>
      <TableContainer component={Paper}>
      <Table aria-label="collapsible table" size="small">
        <TableHead>
          <TableRow>
            <TableCell/>
        {columns.map((column, index) => (
            <TableCell key={index} alignItems={column.align || 'left'}>
          {column.sortKey ? (
              <TableSortLabel
                active={sortKey === column.sortKey}
          direction={
            sortKey === column.sortKey ? sortDirection : 'asc'
        }
      onClick={() => handleSort(column.sortKey)}>
      {column.label}
      </TableSortLabel>
    ) : (
        column.label
      )}
      </TableCell>
    ))}
      {onActionClick && (
        <TableCell alignItems="center">{t('actions')}</TableCell>
      )}
      </TableRow>
      </TableHead>
      <TableBody>
      {paginatedRows.map((row) => (
          <Row
            key={row.id}
        row={row}
        labelButton={labelButton}
        renderExpandableContent={
          renderExpandableContent
          ? () => renderExpandableContent(row)
          : undefined
      }
      onActionClick={onActionClick}/>
    ))}
      </TableBody>
      </Table>
      </TableContainer>
      {sortedRows.length> rowsPerPage && (
        <PaginationControls
          currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}/>
      )}
    </>
  );
}