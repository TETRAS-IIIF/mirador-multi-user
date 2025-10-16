import { Divider, Grid } from '@mui/material';
import { LoginForm } from './LoginForm';
import { getSettingValue, SettingKeys } from '../../../utils/utils.ts';
import { useAdminSettings } from '../../../utils/customHooks/useAdminSettings.ts';
import { OpenIdLogin } from './OpenIdLogin.tsx';

export const LoginPage = () => {
  const { data: settings } = useAdminSettings();

  const allowClassic =
    getSettingValue(SettingKeys.CLASSIC_AUTHENTICATION, settings) === 'true';
  const allowOpenId =
    getSettingValue(SettingKeys.OPENID_CONNECTION, settings) === 'true';

  return (
    <Grid container direction="column" spacing={4}>
      {allowClassic && (
        <Grid>
          <LoginForm/>
        </Grid>
      )}

      {allowClassic && allowOpenId && (
        <Grid>
          <Divider></Divider>
        </Grid>
      )}

      {allowOpenId && (
        <>
          <OpenIdLogin/>
        </>
      )}
    </Grid>
  );
};
