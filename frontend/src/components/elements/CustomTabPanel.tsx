import { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Box, SxProps } from '@mui/material';

type CustomTabPanelProps = {
  children?: ReactNode;
  index: number;
  value: number;
  sx?: SxProps;
} & ComponentPropsWithoutRef<'div'>;

export function CustomTabPanel({
  children,
  value,
  index,
  sx,
  ...other
}: CustomTabPanelProps) {
  const isActive = value === index;

  return (
    <Box
      role="tabpanel"
      hidden={!isActive}
      id={`tab-panel-${index}`}
      aria-labelledby={`tab-${index}`}
      sx={{ height: '85%', ...sx }}
      {...other}
    >
      {isActive ? children : null}
    </Box>
  );
}
