import { useTranslation } from 'react-i18next';
import { Button, Grid } from '@mui/material';
import { initiateImpersonation } from '../api/initiateImpersonation.ts';
import { validateUser } from '../api/validateUser.ts';
import React from 'react';

interface RowData {
  value: React.ReactNode;
  align?: 'right' | 'left' | 'center';
}

interface RowProps {
  id: number;
  data: RowData[];
  setConfirmDeleteUserModal: (userId: number) => void;
}

export function AdminExpandableContent({
  id,
  data,
  setConfirmDeleteUserModal,
}: RowProps) {
  const { t } = useTranslation();

  async function impersonateUser() {
    await initiateImpersonation(id);
  }

  async function handleValidateUser() {
    await validateUser(id);
  }

  return (
    <Grid container spacing={2} flexDirection="row" sx={{ padding: 1 }}>
      <Grid>
        <Button variant="contained" color="primary" onClick={impersonateUser}>
          {t('impersonate')}
        </Button>
      </Grid>
      <Grid>
        <Button
          variant="contained"
          color="primary"
          onClick={handleValidateUser}
          disabled={data[5].value !== 'No' || data[4].value !== 'No'}
        >
          {t('validate_user')}
        </Button>
      </Grid>
      <Grid>
        <Button
          color="error"
          variant="contained"
          onClick={() => setConfirmDeleteUserModal(id)}
        >
          {t('delete_user')}
        </Button>
      </Grid>
    </Grid>
  );
}
