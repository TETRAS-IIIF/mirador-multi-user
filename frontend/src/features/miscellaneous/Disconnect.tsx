import { useNavigate } from 'react-router-dom';
import { Button, Grid, Typography } from '@mui/material';
import { theme } from '../../assets/theme/mainTheme.ts';
import { useTranslation } from 'react-i18next';

export const Disconnect = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Grid
      container
      spacing={1}
      sx={{
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundImage: theme.palette.backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        marginTop: 0,
      }}
    >
      <Grid
        container
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
        }}
        spacing={1}
      >
        <Grid>
          <Typography variant="h5" component="div">
            {t('disconnect_error')}
          </Typography>
        </Grid>
        <Grid>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/auth/login')}
          >
            {t('login')}
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};
