import { useForm } from 'react-hook-form';
import { Button, Grid, Snackbar, Typography } from '@mui/material';
import FormField from 'components/elements/FormField.tsx';
import { RegisterFormData, UserSchema } from '../types/types.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegister } from '../../../utils/auth.tsx';
import { RegisterCredentialsDTO } from '../api/register.ts';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [successRegister, setSuccessRegister] = useState(false);

  const onSubmit = async (data: RegisterCredentialsDTO) => {
    await createUser(data, {
      onSuccess: () => {
        setSuccessRegister(true);
      },
      onError: (error: any) => {
        if (error.status === 409) {
          return setMessage(t('user_already_exists'));
        }
        setOpen(true);
        setMessage(error.toString());
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
        <form>
          <Snackbar open={open} message={message} autoHideDuration={10} />
          <Grid
            container
            direction="column"
            justifyContent="center"
            spacing={2}
            maxWidth={'1000px'}
          >
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
            <Grid item>
              <FormField
                type="text"
                placeholder={t('name')}
                name="name"
                required={true}
                register={register}
                error={errors.name}
              />
            </Grid>
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
              <FormField
                type="password"
                placeholder={t('confirm-password')}
                name="confirmPassword"
                register={register}
                required={true}
                error={errors.confirmPassword}
              />
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
          </Grid>
        </form>
      )}
    </>

  );
};
