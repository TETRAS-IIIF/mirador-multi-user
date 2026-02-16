import {
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
import { ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RowAdminPanel } from './RowAdminPanel.tsx';
import { PaginationControls } from '../../../components/elements/Pagination.tsx';
import { ModalConfirmDelete } from '../../projects/components/ModalConfirmDelete.tsx';
import { MMUModal } from '../../../components/elements/modal.tsx';
import { deleteAccount } from '../../auth/api/deleteAccount.ts';
import toast from 'react-hot-toast';

interface RowData {
  value: ReactNode;
  align?: 'right' | 'left' | 'center';
}

interface RowProps {
  id: number;
  data: RowData[];
}

interface Column {
  label: string;
  align?: 'right' | 'left' | 'center';
  sortKey?: string;
}

interface CollapsibleTableProps {
  columns: Column[];
  rows: RowProps[];
  fetchUsers: () => Promise<void>;
}

export function AdminCollapsibleTable({
  columns,
  rows,
  fetchUsers,
}: CollapsibleTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDeleteUserModal, setConfirmDeleteUserModal] = useState<
    number | undefined
  >(undefined);
  const rowsPerPage = 10;
  const [filter, setFilter] = useState('');
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
    if (!filter) return rows;
    setCurrentPage(1);
    return rows.filter((row) =>
      row.data.some((cell) =>
        String(cell.value).toLowerCase().includes(filter.toLowerCase()),
      ),
    );
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

  const handleDeleteAccount = async () => {
    if (confirmDeleteUserModal) {
      const responseDelete = await deleteAccount(confirmDeleteUserModal);
      if (responseDelete) {
        toast.success(t('confirm_delete_account'));
      }
      setConfirmDeleteUserModal(undefined);
      fetchUsers();
    }
  };
  return (
    <>
      <Grid container spacing={2} alignItems="center" sx={{ marginBottom: 2 }}>
        <Grid size={12}>
          <TextField
            fullWidth
            slotProps={{
              htmlInput: {
                maxLength: 255,
              },
            }}
            label={t('filter')}
            variant="outlined"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </Grid>
      </Grid>
      <TableContainer component={Paper}>
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell />
              {columns.map((column) => {
                const isActive = sortKey === column.sortKey;

                return (
                  <TableCell
                    key={column.sortKey || column.label}
                    align={column.align || 'left'}
                    style={{
                      maxWidth: 200,
                      whiteSpace: 'normal',
                    }}
                  >
                    {column.sortKey ? (
                      <TableSortLabel
                        active={isActive}
                        direction={isActive ? sortDirection : 'asc'}
                        onClick={() => handleSort(column.sortKey)}
                        style={{ whiteSpace: 'normal' }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            whiteSpace: 'normal',
                            lineHeight: 1.2,
                            wordBreak: 'break-word',
                          }}
                        >
                          {column.label}
                        </span>
                      </TableSortLabel>
                    ) : (
                      <span
                        style={{
                          display: 'inline-block',
                          whiteSpace: 'normal',
                          lineHeight: 1.2,
                          wordBreak: 'break-word',
                        }}
                      >
                        {column.label}
                      </span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>{' '}
          <TableBody>
            {paginatedRows.map((row) => (
              <RowAdminPanel
                key={row.id}
                row={row}
                setConfirmDeleteUserModal={setConfirmDeleteUserModal}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {sortedRows.length > rowsPerPage && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
      {confirmDeleteUserModal != undefined && (
        <MMUModal
          width={400}
          openModal={confirmDeleteUserModal}
          setOpenModal={() => setConfirmDeleteUserModal(undefined)}
        >
          <ModalConfirmDelete
            deleteItem={handleDeleteAccount}
            content={t('admin_delete_Confirmation')}
            buttonLabel={t('deleteDefinitely')}
            itemId={confirmDeleteUserModal}
          />
        </MMUModal>
      )}
    </>
  );
}
