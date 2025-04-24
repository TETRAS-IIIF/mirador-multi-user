import { Button, Checkbox, FormControlLabel, Grid, Link } from '@mui/material';
import { confirmationMail } from '../api/confirmationMail.ts';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Layout } from './layout.tsx';
import { useTranslation } from 'react-i18next';
import storage from '../../../utils/storage.ts';
import { useState } from 'react';

export const MailConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
      let toastMessage: string;
      if (returnStatus === 201) {
        toastMessage = t('emailConfirmed');
      } else {
        toastMessage = t('error_occurred');
      }
      storage.clearToken();
      if (returnStatus === 201) {
        toast.success(toastMessage);
        navigate('/');
      } else {
        toast.error(toastMessage);
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
    </Layout>
  );
};
