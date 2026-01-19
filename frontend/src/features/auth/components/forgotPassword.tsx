import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { Layout } from './Layout.tsx';
import { forgotPassword } from '../api/forgotPassword.ts';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [userFeedBack, setUserFeedBack] = useState('');
  const { t } = useTranslation();

  const handleForgotPassword = async () => {
    setError('');
    setUserFeedBack('');

    if (!email) {
      setError(t('errorMail'));
      return;
    }
    await forgotPassword(email);
    setUserFeedBack(t('ResetPasswordFeedback'));
  };

  return (
    <Layout
      title={t('titleForgotPassword')}
      rightButton={
        <Grid>
          <NavLink to="/auth/login" data-testid="login-link">
            <Typography variant="button">{t('login')}</Typography>
          </NavLink>
        </Grid>
      }
    >
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center" alignItems="center">
          <Box sx={{ p: 4, width: '100%' }}>
            <Typography variant="body2" alignItems="center" sx={{ mb: 2 }}>
              {t('explanationPasswordReset')}
            </Typography>
            <TextField
              inputProps={{
                maxLength: 255,
              }}
              data-testid="email-input"
              label={t('mail')}
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }} data-testid="error-alert">
                {error}
              </Alert>
            )}
            {userFeedBack && (
              <Alert severity="info" sx={{ mt: 2 }} data-testid="success-alert">
                {userFeedBack}
              </Alert>
            )}
            <Button
              variant="contained"
              color="primary"
              disabled={!email}
              fullWidth
              sx={{ mt: 3 }}
              onClick={handleForgotPassword}
              data-testid="submit-button"
            >
              {t('submit')}
            </Button>
          </Box>
        </Box>
      </Container>
    </Layout>
  );
};

export default ForgotPassword;
