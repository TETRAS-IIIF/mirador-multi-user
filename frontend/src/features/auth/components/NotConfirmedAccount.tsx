import { Button, CircularProgress, Grid, Typography } from '@mui/material';
import { ResendConfirmationMail } from '../api/resendConfirmationMail.ts';
import { useState } from 'react';
import { Layout } from './layout.tsx';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import storage from '../../../utils/storage.ts';
import { SuccessCard } from './SuccesCard.tsx';

export const NotConfirmedAccount = () => {
  const [successSentConfirmationLink, setSuccessSentConfirmationLink] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleResendConfirmation = async () => {
    setIsLoading(true);
    const email = storage.getUserEmail();
    const confirmationStatus = await ResendConfirmationMail(
      email!,
      navigator.language.split('-')[0],
    );
    if (confirmationStatus === 200) {
      toast.success(t('messageConfirmationLink'), { duration: 10000 });
      storage.clearUserEmail();
      setSuccessSentConfirmationLink(true);
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
        <>
          {successSentConfirmationLink ? (
            <SuccessCard>
              <Typography variant="h5" gutterBottom>
                {t('messageConfirmationLink')}
              </Typography>
            </SuccessCard>
          ) : (
            <Grid>
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
          )}
        </>
      </Grid>
    </Layout>
  );
};
