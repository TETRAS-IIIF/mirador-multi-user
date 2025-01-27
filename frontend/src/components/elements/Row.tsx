import React from "react";
import {
  Box,
  Button,
  Collapse,
  IconButton,
  TableCell,
  TableRow,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

interface RowData {
  value: React.ReactNode;
  align?: "right" | "left" | "center";
}

interface RowProps {
  id: number;
  data: RowData[];
}

interface SingleRowProps {
  row: RowProps;
  renderExpandableContent?: (row: RowProps) => React.ReactNode;
  onActionClick?: (row: RowProps) => void;
}

export function Row({
  row,
  renderExpandableContent,
  onActionClick,
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
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        {row.data.map((cell, index) => (
          <TableCell key={index} align={cell.align || "left"}>
            {cell.value}
          </TableCell>
        ))}
        <TableCell align="center">
          <Button
            variant="contained"
            color="primary"
            onClick={() => onActionClick?.(row)}
          >
            {t("impersonate")}
          </Button>
        </TableCell>
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
