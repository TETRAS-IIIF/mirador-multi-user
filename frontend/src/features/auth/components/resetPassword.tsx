import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { Layout } from './layout.tsx';
import { resetPassword } from '../api/resetPassword.ts';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const url = window.location.href;
    const match = url.match(/\/reset-password\/(.+)/);
    if (match) {
      setToken(match[1]);
    } else {
      setError(t('errorToken'));
    }
  }, []);

  const handlePasswordReset = async () => {
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }
    if (!token) {
      setError(t('invalidToken'));
    }
    if (token) {
      const response = await resetPassword(token, password);
      if (response) {
        setSuccess(t('passwordResetSuccess'));
      } else {
        setSuccess(t('passwordResetError'));
      }
    }
  };
  return (
    <Layout
      title={t('reset-password-title')}
      rightButton={
        <Grid>
          <NavLink to="/auth/login">
            <Typography variant="button">{t('login')}</Typography>
          </NavLink>
        </Grid>
      }
    >
      <Container maxWidth="sm">
        <Box sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h5" align="center" gutterBottom>
            {t('reset-password')}
          </Typography>
          <TextField
            inputProps={{
              maxLength: 255,
            }}
            label={t('new-password')}
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <TextField
            inputProps={{
              maxLength: 255,
            }}
            label="Confirm New Password"
            type="password"
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
            onClick={handlePasswordReset}
          >
            {t('reset-password')}
          </Button>
        </Box>
      </Container>
    </Layout>
  );
};
