import { useTranslation } from 'react-i18next';
import { Button, Grid } from '@mui/material';
import { initiateImpersonation } from '../api/initiateImpersonation.ts';
import { validateUser } from '../api/validateUser.ts';
import toast from 'react-hot-toast';

interface RowProps {
  id: number;
}


export function AdminExpandableContent({ id }: RowProps) {
  const { t } = useTranslation();

  async function impersonateUser() {
    await initiateImpersonation(id);
  }

  async function handleValidateUser() {
    const validate = await validateUser(id)
    if (validate === 201) {
      toast.success(t('user_validate'));
    } else {
      toast.error(t('error_validate'));
    }
  }

  return (
    <Grid container spacing={2} flexDirection="row">
      <Grid item>
        <Button
          variant="contained"
          color="primary"
          onClick={impersonateUser}
        >
          {t('impersonate')}
        </Button>
      </Grid>
      <Grid item>
        <Button
          variant="contained"
          color="primary"
          onClick={handleValidateUser}
        >
          {t('validate_user')}
        </Button>
      </Grid>
    </Grid>
  );
}