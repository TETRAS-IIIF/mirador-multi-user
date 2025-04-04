import { useTranslation } from 'react-i18next';
import { Button, Grid } from '@mui/material';
import { initiateImpersonation } from '../api/initiateImpersonation.ts';
import { validateUser } from '../api/validateUser.ts';

interface RowProps {
  id: number;
}


export function AdminExpandableContent({ id }: RowProps) {
  const { t } = useTranslation();

  async function impersonateUser() {
    await initiateImpersonation(id);
  }

  async function handleValidateUser() {
    return await validateUser(id)
  }

  return (
    <Grid container spacing={2} flexDirection="column">
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