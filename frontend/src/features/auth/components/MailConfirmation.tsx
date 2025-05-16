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
      const apiResponse = await confirmationMail(token);
      if (apiResponse.access_token) {
        toast.success(t('emailConfirmed'));
        storage.setToken(apiResponse.access_token);
        navigate('/app/my-projects');
      } else {
        toast.error(t('error_occurred'));
        storage.clearToken();
      }
    } else {
      console.error('Token not found in the URL');
    }
  };

  const handleCheckBox = () => {
    setChecked(!checked);
  };

  return (
    <Layout title={t('mail-confirmation-title')}>
      <Grid
        item
        container
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
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
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmMail}
            disabled={!checked}
          >
            {t('confirm-mail')}
          </Button>
        </Grid>
      </Grid>
    </Layout>
  );
};
