import { ReactNode } from 'react';
import { Box, Card, CardContent } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

type SuccessCardProps = {
  children: ReactNode;
};

export const SuccessCard = ({ children }: SuccessCardProps) => {
  return (
    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 4, textAlign: 'center', p: 3 }}>
      <CardContent>
        <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
        <Box>{children}</Box>
      </CardContent>
    </Card>
  );
};
