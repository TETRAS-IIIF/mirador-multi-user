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
import { PASSWORD_MINIMUM_LENGTH } from '../../../utils/utils.ts';

export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    try {
      if (!globalThis?.location?.href) {
        setError(t('errorToken'));
        return;
      }
      const url = new URL(globalThis.location.href);
      const match = /\/reset-password\/([^/]+)/.exec(url.pathname);
      if (match) setToken(match[1]);
      else setError(t('errorToken'));
    } catch {
      setError(t('errorToken'));
    }
  }, [t]);

  const handlePasswordReset = async () => {
    setError('');
    setSuccess('');

    if (password.length < PASSWORD_MINIMUM_LENGTH) {
      setError(t('passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }
    if (!token) {
      setError(t('invalidToken'));
      return;
    }

    const ok = await resetPassword(token, password);
    if (ok) setSuccess(t('passwordResetSuccess'));
    else setError(t('passwordResetError'));
  };

  const isCompleted = Boolean(success);
  const canSubmit =
    password.length>= PASSWORD_MINIMUM_LENGTH && confirmPassword.length> 0;

  return (
    <Layout
      title={t('reset-password-title')}
      rightButton={
        <Grid>
          <NavLink to="/auth/login">
            <Typography variant="button">{t('login')}</Typography>
          </NavLink>
        </Grid>
      }>
      <Container maxWidth="sm">
        <Box sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h5" alignItems="center" gutterBottom>
            {t('reset-password')}
          </Typography>

          <TextField
            inputProps={{ maxLength: 255 }}
            label={t('new-password')}
            type="password"
            autoComplete="new-password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isCompleted}/>

          <TextField
            inputProps={{ maxLength: 255 }}
            label={t('confirm-new-password')}
            type="password"
            autoComplete="new-password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isCompleted}/>

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

          {isCompleted ? (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              component={NavLink}
              to="/auth/login"
              sx={{ mt: 3 }}>
              {t('login')}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={!canSubmit}
              sx={{ mt: 3 }}
              onClick={handlePasswordReset}>
              {t('reset-password')}
            </Button>
          )}
        </Box>
      </Container>
    </Layout>
  );
};
