import React from 'react';
import {
  Button,
  Collapse,
  IconButton,
  TableCell,
  TableRow,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { RowProps } from '../../features/projects/types/types.ts';

interface SingleRowProps {
  row: RowProps;
  renderExpandableContent?: (row: RowProps) => React.ReactNode | undefined;
  onActionClick?: (row: RowProps) => void;
  labelButton?: string;
}

export function Row({
  row,
  renderExpandableContent,
  onActionClick,
  labelButton,
}: SingleRowProps) {
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation();
  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp/> : <KeyboardArrowDown/>}
          </IconButton>
        </TableCell>
        {row.data.map((cell) => (
          <TableCell key={cell.value} alignItems={cell.align || 'left'}>
            {cell.value}
          </TableCell>
        ))}
        {labelButton && (
          <TableCell alignItems="center">
            <Button
              variant="contained"
              color="primary"
              onClick={() => onActionClick?.(row)}>
              {t(labelButton)}
            </Button>
          </TableCell>
        )}
      </TableRow>
      {renderExpandableContent && (
        <TableRow>
          <TableCell
            colSpan={row.data.length + 2}
            sx={{
              paddingTop: 0,
              paddingBottom: 0,
            }}>
            <Collapse sx={{ padding: 0, margin: 0 }} in={open}>
              {renderExpandableContent(row)}
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
