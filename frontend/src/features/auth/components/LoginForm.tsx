import { Button, Grid } from '@mui/material';
import FormField from 'components/elements/FormField.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginFormData, LoginSchema } from '../types/types.ts';
import { useLogin } from '../../../utils/auth.tsx';
import { LoginCredentialsDTO } from '../api/login.ts';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const LoginForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { mutateAsync: loginUser } = useLogin();

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

  return (
    <form>
      <Grid container flexDirection="column" spacing={2}>
        <Grid>
          <FormField
            type="mail"
            placeholder={t('mail')}
            name="mail"
            required={true}
            register={register}
            error={errors.mail}
          />
        </Grid>
        <Grid container alignItems="center" spacing={2}>
          <Grid>
            <FormField
              type="password"
              placeholder={t('password')}
              name="password"
              register={register}
              required={true}
              error={errors.password}
            />
          </Grid>
          <Grid>
            <Button
              variant="text"
              color="primary"
              onClick={() => (window.location.href = '/forgot-password')}
            >
              {t('forgot-password')}
            </Button>
          </Grid>
        </Grid>
        <Grid container>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            onClick={handleSubmit(onSubmit)}
          >
            {t('submit')}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};
