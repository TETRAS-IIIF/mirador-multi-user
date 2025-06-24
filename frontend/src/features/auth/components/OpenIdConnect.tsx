import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Box, CircularProgress, Paper, Typography } from '@mui/material';
import storage from '../../../utils/storage.ts';

export const OpenIdConnect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      storage.clearToken();
      storage.setToken(token);

      navigate('/');
    } else {
      setStatus('error');
    }
  }, [searchParams, navigate]);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
    >
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', minWidth: 300 }}>
        {status === 'loading' && (
          <>
            <CircularProgress />
            <Typography variant="h6" mt={2}>
              Processing authentication...
            </Typography>
          </>
        )}

        {status === 'error' && (
          <Alert severity="error">
            Authentication failed or token missing.
          </Alert>
        )}
      </Paper>
    </Box>
  );
};
