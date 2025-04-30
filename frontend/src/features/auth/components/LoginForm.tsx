import { Button, Grid } from '@mui/material';
import FormField from 'components/elements/FormField.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginFormData, LoginSchema } from '../types/types.ts';
import { useLogin } from '../../../utils/auth.tsx';
import { LoginCredentialsDTO } from '../api/login.ts';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSettingValue, KC_CLIENT, KC_URL, SettingKeys } from '../../../utils/utils.ts';
import { useAdminSettings } from '../../../utils/customHooks/useAdminSettings.ts';

export const LoginForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutateAsync: loginUser } = useLogin();
  const { data: settings } = useAdminSettings();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginCredentialsDTO) => {
    try {
      await loginUser(data, {
        onSuccess: () => navigate('/app/my-projects'),
      });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const openIdAuth = () => {

    const keycloakUrl = `${KC_URL}/protocol/openid-connect/auth`;
    const redirectUri = window.location.origin + '/auth/openId-callback';

    window.location.href = `${keycloakUrl}?client_id=${KC_CLIENT}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&response_type=code&scope=openid email profile`;
  };

  const showOpenIdConnect = getSettingValue(SettingKeys.OPEN_ID_CONNECT_ALLOWED, settings) === '1';
  return (
    <form>
      <Grid container flexDirection="column" spacing={2}>
        <Grid item>
          <FormField
            type="mail"
            placeholder={t('mail')}
            name="mail"
            required={true}
            register={register}
            error={errors.mail}
          />
        </Grid>
        <Grid item container alignItems="center" spacing={2}>
          <Grid item>
            <FormField
              type="password"
              placeholder={t('password')}
              name="password"
              register={register}
              required={true}
              error={errors.password}
            />
          </Grid>
          <Grid item>
            <Button
              variant="text"
              color="primary"
              onClick={() => (window.location.href = '/forgot-password')}
            >
              {t('forgot-password')}
            </Button>
          </Grid>
        </Grid>
        <Grid item container>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            onClick={handleSubmit(onSubmit)}
          >
            {t('submit')}
          </Button>
        </Grid>
        <Grid item container>
          {
            showOpenIdConnect && (
              <Button
                variant="contained"
                color="primary"
                onClick={openIdAuth}
              >
                {t('button_openid_connect')}
              </Button>
            )
          }
        </Grid>
      </Grid>
    </form>
  );
};
