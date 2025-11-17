import { RegisterForm } from '../components/RegisterForm.tsx';
import { Layout } from '../components/layout.tsx';
import { Grid, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Register = () => {
  const { t } = useTranslation();

  return (
    <Layout
      title={t('account-creation-title')}
      rightButton={
        <Grid>
          <NavLink to="/auth/login">
            <Typography variant="button">{t('login')}</Typography>
          </NavLink>
        </Grid>
      }
    >
      <RegisterForm />
    </Layout>
  );
};
