import { Layout } from '../components/layout';
import { LoginForm } from '../components/LoginForm';
import { Grid, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminSettings } from '../../../utils/customHooks/useAdminSettings.ts';

export const Login = () => {
  const { t } = useTranslation();
  const { data: settings } = useAdminSettings();

  const displayRegisterButton =
    settings?.mutableSettings.find((s) => s.key === 'DISPLAY_USER_INSCRIPTION_PAGE')?.value === 'true' ||
    settings?.unMutableSettings.find(([key]) => key === 'DISPLAY_USER_INSCRIPTION_PAGE')?.[1] === 'true';

  return (
    <Layout
      title={t('loginTitle')}
      rightButton={
        displayRegisterButton && (
          <Grid>
            <NavLink to="/auth/signin">
              <Typography variant="button">{t('register')}</Typography>
            </NavLink>
          </Grid>
        )
      }
    >
      <Grid item>
        <LoginForm />
      </Grid>
    </Layout>
  );
};
