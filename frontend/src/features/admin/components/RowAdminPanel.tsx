import React from 'react';
import {
  Box,
  Collapse,
  IconButton,
  TableCell,
  TableRow,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

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
  renderExpandableContent?: (row: RowProps) => React.ReactNode;
}

export function RowAdminPanel(
  {
    row,
    renderExpandableContent,
  }: SingleRowProps) {
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
      {renderExpandableContent && (
        <TableRow>
          <TableCell colSpan={row.data.length + 2}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box>{renderExpandableContent(row)}</Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
