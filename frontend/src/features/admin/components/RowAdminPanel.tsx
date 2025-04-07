import React from 'react';
import { Collapse, IconButton, TableCell, TableRow } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { AdminExpandableContent } from './AdminExpandableContent.tsx';

interface RowData {
  value: React.ReactNode;
  align?: 'right' | 'left' | 'center';
}

interface RowProps {
  id: number;
  data: RowData[];
}

interface SingleRowProps {
  row: RowProps;
}

export function RowAdminPanel({ row }: SingleRowProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        {row.data.map((cell, index) => (
          <TableCell key={index} align={cell.align || 'left'}>
            {cell.value}
          </TableCell>
        ))}
      </TableRow>
      <TableRow>
        <TableCell
          colSpan={row.data.length + 2}
          sx={{
            paddingTop: 0,
            paddingBottom: 0,
          }}>
          <Collapse in={open} timeout="auto" unmountOnExit sx={{ padding: 1 }}>
            <AdminExpandableContent id={row.id} />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}
