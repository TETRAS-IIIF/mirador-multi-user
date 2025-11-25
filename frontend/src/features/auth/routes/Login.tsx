import { Layout } from '../components/Layout.tsx';
import { Grid, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminSettings } from '../../../utils/customHooks/useAdminSettings.ts';
import { getSettingValue, SettingKeys } from '../../../utils/utils.ts';
import { LoginPage } from '../components/LoginPage.tsx';

export const Login = () => {
  const { t } = useTranslation();
  const { data: settings } = useAdminSettings();

  const showInscription =
    getSettingValue(SettingKeys.ALLOW_NEW_USER, settings) === 'true';
  return (
    <Layout
      title={t('loginTitle')}
      rightButton={
        showInscription && (
          <Grid>
            <NavLink to="/auth/signin">
              <Typography variant="button">{t('register')}</Typography>
            </NavLink>
          </Grid>
        )
      }
    >
      <Grid>
        <LoginPage />
      </Grid>
    </Layout>
  );
};
