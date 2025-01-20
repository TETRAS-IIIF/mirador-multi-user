import { Box, Pagination } from '@mui/material';
import { ChangeEvent } from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PaginationControls = ({
                                     currentPage,
                                     totalPages,
                                     onPageChange
                                   }: PaginationControlsProps) => {
  const handleChange = (_event: ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  };

  return (
    <Box display="flex" justifyContent="center" mt={2}>
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={handleChange}
        color="primary"
      />
    </Box>
  );
};

