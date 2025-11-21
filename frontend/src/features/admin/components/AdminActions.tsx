import { useSendTestMail } from '../api/sendTestMail.ts';
import { Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { LoadingButton } from '@mui/lab';
import { useAppLogs } from '../api/getAppLogs.ts';

export const AdminActions = () => {
  const { t } = useTranslation();
  const { mutateAsync: sendTestMail, isPending } = useSendTestMail();
  const { mutateAsync: downloadLogs, isPending: isDownloading } = useAppLogs();

  const handleSuccess = (blob: Blob) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    toast.success(t('success_download_logs'));
  };

  const handleError = () => {
    toast.error(t('error_download_logs'));
  };

  const handleDownloadAppLogs = () => {
    downloadLogs(undefined, {
      onSuccess: handleSuccess,
      onError: handleError,
    });
  };

  const handleSendTestMail = async () => {
    await sendTestMail(undefined, {
      onSuccess: () => toast.success(t('success_send_mail')),
      onError: () => toast.error(t('error_send_mail')),
    });
  };
  return (
    <Grid container spacing={1} flexDirection="column">
      <Grid>
        <Typography variant="h6" component="div">
          {t('admin_action_title')}
        </Typography>
      </Grid>
      <Grid container spacing={2}>
        <Grid>
          <LoadingButton
            size="large"
            variant="contained"
            onClick={handleSendTestMail}
            loading={isPending}
          >
            {t('send_test_mail')}
          </LoadingButton>
        </Grid>
        <Grid>
          <LoadingButton
            size="large"
            variant="contained"
            onClick={handleDownloadAppLogs}
            loading={isDownloading}
          >
            {t('download_logs')}
          </LoadingButton>
        </Grid>
      </Grid>
    </Grid>
  );
};
