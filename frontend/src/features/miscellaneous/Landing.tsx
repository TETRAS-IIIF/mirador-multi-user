import { useNavigate } from 'react-router-dom';
import { Button, Grid, Typography } from '@mui/material';
import { theme } from '../../assets/theme/mainTheme.ts';
import { useTranslation } from 'react-i18next';
import { LandingFooter } from '../../../customAssets/landing-footer.tsx';
import { useAdminSettings } from '../../utils/customHooks/useAdminSettings.ts';
import { LoadingSpinner } from '../../components/elements/loadingSpinner.tsx';
import {
  getSettingValue,
  OIDC_CLIENT_ID,
  OIDC_REDIRECT_URI,
  OPEN_ID_CONNECT_URL,
  SettingKeys,
} from '../../utils/utils.ts';

export const Landing = () => {
  const navigate = useNavigate();
  const { data: settings, isLoading } = useAdminSettings();

  const allowClassic =
    getSettingValue(SettingKeys.CLASSIC_AUTHENTICATION, settings) === 'true';
  const allowOpenIdConnect =
    getSettingValue(SettingKeys.OPENID_CONNECTION, settings) === 'true';

  const { t } = useTranslation();
  const HandleSignIn = () => {
    navigate('/auth/signin');
  };
  const HandleLogin = () => {
    if (!allowClassic && allowOpenIdConnect) {
      window.location.href =
        `${OPEN_ID_CONNECT_URL}/protocol/openid-connect/auth` +
        `?client_id=${OIDC_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(OIDC_REDIRECT_URI)}` +
        `&response_type=code` +
        `&scope=openid%20email%20profile`;
    } else {
      navigate('/auth/login');
    }
  };

  const showInscription =
    getSettingValue(SettingKeys.ALLOW_NEW_USER, settings) === 'true';
  return (
    <Grid
      container
      direction="column"
      justifyContent="center"
      alignItems="center"
      spacing={10}
      minHeight={'100vh'}
      sx={{
        backgroundImage: theme.palette.backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        marginTop: 0,
      }}
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <Grid>
            <Typography variant="h2" component="h1">
              {t('welcome', {
                instanceName: import.meta.env.VITE_INSTANCE_NAME,
              })}
            </Typography>
          </Grid>

          <Grid
            container
            justifyContent="center"
            spacing={5}
            alignItems="center"
          >
            {showInscription && (
              <Grid>
                <Button variant="contained" onClick={HandleSignIn}>
                  {t('create-account')}
                </Button>
              </Grid>
            )}
            <Grid>
              <Button variant="contained" onClick={HandleLogin}>
                {t('login')}
              </Button>
            </Grid>
          </Grid>
        </>
      )}
      <Grid width={'100%'}>
        <LandingFooter></LandingFooter>
      </Grid>
    </Grid>
  );
};
