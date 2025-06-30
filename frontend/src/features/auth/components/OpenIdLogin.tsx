import { Button, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { OIDC_CLIENT_ID, OPEN_ID_URL } from '../../../utils/utils.ts';

export const OpenIdLogin = () => {
  const { t } = useTranslation();

  function redirectToOpenIdLogin() {
    const redirectUri = `${window.location.origin}/auth/openId-callback`;

    console.log('OPEN_ID_URL : ', OPEN_ID_URL);
    console.log('OIDC_CLIENT_ID : ', OIDC_CLIENT_ID);
    window.location.href =
      `${OPEN_ID_URL}/protocol/openid-connect/auth` +
      `?client_id=${OIDC_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=openid%20email%20profile`;
  }

  return (
    <Grid item>
      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={redirectToOpenIdLogin}
      >
        {t('login-with-openid')}
      </Button>
    </Grid>
  );
};
