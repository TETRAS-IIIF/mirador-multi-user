import { Button, Card, CardContent, Checkbox, FormControlLabel, Grid, Link, Typography } from '@mui/material';
import { confirmationMail } from '../api/confirmationMail.ts';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Layout } from './layout.tsx';
import { useTranslation } from 'react-i18next';
import storage from '../../../utils/storage.ts';
import { useState } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export const MailConfirmation = () => {
  const location = useLocation();
  const [successConfirmation, setsuccessConfirmation] = useState(false);
  const [checked, setChecked] = useState(false);
  const { t } = useTranslation();
  const handleConfirmMail = async () => {
    const extractToken = () => {
      const tokenMatch = location.pathname.match(/token\/([^/]+)/);
      return tokenMatch ? tokenMatch[1] : null;
    };

    const token = extractToken();

    if (token) {
      const returnStatus = await confirmationMail(token);
      storage.clearToken();
      if (returnStatus === 201) {
        setsuccessConfirmation(true)
        toast.success('emailConfirmed');
      } else if (returnStatus === 400) {
        toast.error(t('error_already_confirmed'));
      } else {
        toast.error(t('error_occurred'));
      }
    } else {
      console.error('Token not found in the URL');
    }
  };

  const handleCheckBox = () => {
    setChecked(!checked);
  }

  return (
    <Layout title={t('mail-confirmation-title')}>
      <>
        {successConfirmation ? (
          <Card sx={{ maxWidth: 500, mx: 'auto', mt: 4, textAlign: 'center', p: 3 }}>
            <CardContent>
              <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                {t('emailConfirmed')}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid item container flexDirection="column" justifyContent="center" alignItems="center">

            <Grid item>
              <FormControlLabel
                required
                control={<Checkbox onChange={handleCheckBox} />}
                label={
                  <>
                    {t('accept_terms')}
                    <Link component={RouterLink} to="/terms" target="_blank">
                      {t('terms')}
                    </Link>
                  </>
                }
              />
            </Grid>
            <Grid item>
              <Button variant="contained" color="primary" onClick={handleConfirmMail} disabled={!checked}>
                {t('confirm-mail')}
              </Button>
            </Grid>
          </Grid>
        )
        }

      </>
    </Layout>
  );
};
