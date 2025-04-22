import {
  Button,
  CircularProgress,
  Grid,
} from '@mui/material';
import { ResendConfirmationMail } from '../api/resendConfirmationMail.ts';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Layout } from './layout.tsx';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import storage from '../../../utils/storage.ts';


export const NotConfirmedAccount = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();


  const handleResendConfirmation = async () => {
    setIsLoading(true);
    const email = storage.getUserEmail();
    const confirmationStatus = await ResendConfirmationMail(email!, navigator.language.split('-')[0]);
    if (confirmationStatus === 200) {
      toast.success(t('messageConfirmationLink'), { duration: 10000 });
      storage.clearUserEmail()
      setTimeout(() => navigate('/'), 2000);
    } else {
      toast.error(t('resendError'), { duration: 10000 });
      setIsLoading(false);
    }
  };

  return (
    <Layout title={t('notConfirmedAccountTitle')}>
      <Grid
        container
        direction="column"
        justifyContent="center"
        alignItems="center"
        spacing={2}
      >
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            onClick={handleResendConfirmation}
            disabled={isLoading}
          >
            {isLoading ? (
              <CircularProgress size={24} />
            ) : (
              t('resendConfirmationLink')
            )}
          </Button>
        </Grid>
      </Grid>
    </Layout>
  );
};
