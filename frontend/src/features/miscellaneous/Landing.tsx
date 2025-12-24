import { useNavigate } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
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
  const { t } = useTranslation();

  const allowClassic =
    getSettingValue(SettingKeys.CLASSIC_AUTHENTICATION, settings) === 'true';
  const allowOpenIdConnect =
    getSettingValue(SettingKeys.OPENID_CONNECTION, settings) === 'true';

  const showInscription =
    getSettingValue(SettingKeys.ALLOW_NEW_USER, settings) === 'true';

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

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: theme.palette.backgroundImage,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          px: { xs: 2, sm: 4 },
        }}
      >
        <LoadingSpinner />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: theme.palette.backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 4 },
          py: { xs: 4, md: 8 },
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            textAlign: 'center',
            mb: { xs: 3, md: 5 },
            wordBreak: 'break-word',
          }}
        >
          {t('welcome', {
            instanceName: import.meta.env.VITE_INSTANCE_NAME,
          })}
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            width: '100%',
            maxWidth: 400,
            justifyContent: 'center',
          }}
        >
          {showInscription && (
            <Button variant="contained" onClick={HandleSignIn} fullWidth>
              {t('create-account')}
            </Button>
          )}

          <Button variant="contained" onClick={HandleLogin} fullWidth>
            {t('login')}
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          width: '100%',
        }}
      >
        <LandingFooter />
      </Box>
    </Box>
  );
};
