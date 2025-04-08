import { Layout } from '../components/layout';
import { LoginForm } from '../components/LoginForm';
import { Grid, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminSettings } from '../../../utils/customHooks/useAdminSettings.ts';
import { getSettingValue } from '../../../utils/utils.ts';

export const Login = () => {
  const { t } = useTranslation();
  const { data: settings } = useAdminSettings();

  const showInscription = getSettingValue('DISPLAY_USER_INSCRIPTION_PAGE', settings) === 'true';

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
      <Grid item>
        <LoginForm />
      </Grid>
    </Layout>
  );
};
