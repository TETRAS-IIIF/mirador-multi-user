import { Button, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import FormField from '../../../components/elements/FormField.tsx';
import { useRegister } from '../../../utils/auth.tsx';
import { useForm } from 'react-hook-form';
import { RegisterFormData, UserSchema } from '../../auth/types/types.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterCredentialsDTO } from '../../auth/api/register.ts';
import toast from 'react-hot-toast';
import { Dispatch, SetStateAction } from 'react';

interface ICreateUserFormProps {
  setopenAddUserModal: Dispatch<SetStateAction<boolean>>;
}

export const CreateUserForm = ({ setopenAddUserModal }: ICreateUserFormProps) => {
  const { t } = useTranslation();
  const { mutateAsync: createUser } = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(UserSchema),
  });


  const onSubmit = async (data: RegisterCredentialsDTO) => {
    try {
      await createUser(data, {
        onSuccess: () => {
          toast.success(t('accountCreated'));
          setopenAddUserModal(false)
        },
      });
    } catch (error: any) {
      console.error('error', error);
      if (
        error.toString() ===
        'Error: a user with this email or username already exists'
      ) {
        return toast.error(t('user_already_exists'));
      }
      toast.error(error.toString());
    }
  };

  return (
    <Grid container wrap="nowrap" spacing={2} flexDirection="column">
      <Grid>
        <Typography variant="h6">
          {t('create_user_form')}
        </Typography>
      </Grid>
      <form>
        <Grid
          container
          direction="column"
          justifyContent="center"
          spacing={2}
          maxWidth={'1000px'}>
          <Grid>
            <FormField
              type="mail"
              placeholder={t('mail')}
              name="mail"
              required={true}
              register={register}
              error={errors.mail}/>
          </Grid>
          <Grid>
            <FormField
              type="text"
              placeholder={t('name')}
              name="name"
              required={true}
              register={register}
              error={errors.name}/>
          </Grid>
          <Grid>
            <FormField
              type="password"
              placeholder={t('password')}
              name="password"
              register={register}
              required={true}
              error={errors.password}/>
          </Grid>
          <Grid>
            <FormField
              type="password"
              placeholder={t('confirm-password')}
              name="confirmPassword"
              register={register}
              required={true}
              error={errors.confirmPassword}/>
          </Grid>
          <Grid container>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              onClick={handleSubmit(onSubmit)}>
              {t('submit')}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Grid>
  )
}