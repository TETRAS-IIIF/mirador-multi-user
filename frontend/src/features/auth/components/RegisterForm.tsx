import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Grid, Snackbar, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import FormField from 'components/elements/FormField.tsx';
import { RegisterFormData, UserSchema } from '../types/types.ts';
import { useRegister } from '../../../utils/auth.tsx';
import { RegisterCredentialsDTO } from '../api/register.ts';
import { SuccessCard } from './SuccesCard.tsx';

export const RegisterForm = () => {
  const { t } = useTranslation();
  const { mutateAsync: createUser } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(UserSchema),
  });

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [successRegister, setSuccessRegister] = useState(false);

  const onSubmit = async (data: RegisterCredentialsDTO) => {
    setOpen(false);
    setMessage('');

    await createUser(data, {
      onSuccess: () => {
        setSuccessRegister(true);
      },
      onError: (error: any) => {
        setOpen(true);

        if (error?.status === 409) {
          setMessage(t('user_already_exists'));
          return;
        }

        setMessage(error?.toString?.() ?? String(error));
        console.error('error creation', error);
      },
    });
  };

  return (
    <>
      {successRegister ? (
        <SuccessCard>
          <Typography variant="h5" gutterBottom>
            {t('account_created_success')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('check_email_to_confirm')}
          </Typography>
        </SuccessCard>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Snackbar open={open} message={message} autoHideDuration={10_000} />

          <Grid
            container
            direction="column"
            justifyContent="center"
            spacing={2}
            maxWidth="1000px"
          >
            <Grid>
              <FormField
                type="mail"
                placeholder={t('mail')}
                name="mail"
                required
                register={register}
                error={errors.mail}
              />
            </Grid>

            <Grid>
              <FormField
                type="text"
                placeholder={t('name')}
                name="name"
                required
                register={register}
                error={errors.name}
              />
            </Grid>

            <Grid>
              <FormField
                type="password"
                placeholder={t('password')}
                name="password"
                required
                register={register}
                error={errors.password}
              />
            </Grid>

            <Grid>
              <FormField
                type="password"
                placeholder={t('confirm-password')}
                name="confirmPassword"
                required
                register={register}
                error={errors.confirmPassword}
              />
            </Grid>

            <Grid container>
              <Button type="submit" variant="contained" color="primary">
                {t('submit')}
              </Button>
            </Grid>
          </Grid>
        </form>
      )}
    </>
  );
};
