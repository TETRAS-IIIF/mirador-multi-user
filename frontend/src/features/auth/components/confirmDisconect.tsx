import { Button, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import LogoutIcon from '@mui/icons-material/Logout';

interface IConfirmDisconnect {
  handleDisconnect: () => void;
}

export const ConfirmDisconnect = ({ handleDisconnect }: IConfirmDisconnect) => {
  const { t } = useTranslation();

  return (
    <Grid item container>
      <Grid item container spacing={1} justifyContent="center">
        <Grid item>
          <Typography>
            {t('messageDisconnect')}
          </Typography>
        </Grid>
        <Grid item>
          <Button
            color="error"
            variant="contained"
            onClick={handleDisconnect}>
            <LogoutIcon sx={{ marginRight: 1 }} />
            {t('disconnect')}
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};
