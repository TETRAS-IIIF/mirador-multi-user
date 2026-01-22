import { ReactNode, Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { LoadingSpinner } from '../components/elements/loadingSpinner.tsx';
import { queryClient } from '../lib/react-query.ts';
import { QueryClientProvider } from '@tanstack/react-query';
import { Box } from '@mui/material';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <LoadingSpinner />
        </Box>
      }
    >
      {' '}
      <QueryClientProvider client={queryClient}>
        <Router
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          {children}
        </Router>
      </QueryClientProvider>
    </Suspense>
  );
};
