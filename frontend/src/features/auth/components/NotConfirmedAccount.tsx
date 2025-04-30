import { Button, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import { ResendConfirmationMail } from '../api/resendConfirmationMail.ts';
import { useState } from 'react';
import { Layout } from './layout.tsx';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import storage from '../../../utils/storage.ts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';


export const NotConfirmedAccount = () => {
  const [successSentConfirmationLink, setSuccessSentConfirmationLink] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();


  const handleResendConfirmation = async () => {
    setIsLoading(true);
    const email = storage.getUserEmail();
    const confirmationStatus = await ResendConfirmationMail(email!, navigator.language.split('-')[0]);
    if (confirmationStatus === 200) {
      toast.success(t('messageConfirmationLink'));
      storage.clearUserEmail()
      setSuccessSentConfirmationLink(true);
    } else {
      toast.error(t('resendError'));
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
            <Card sx={{ maxWidth: 500, mx: 'auto', mt: 4, textAlign: 'center', p: 3 }}>
              <CardContent>
                <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  {t('messageConfirmationLink')}
                </Typography>
              </CardContent>
            </Card>
          ) : (
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
          )
          }

        </>
      </Grid>
    </Layout>
  );
};
