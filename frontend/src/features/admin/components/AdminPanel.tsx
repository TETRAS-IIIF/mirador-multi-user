import { Button, Grid, Typography } from '@mui/material';
import { getAllUsers } from '../api/getAllUsers.ts';
import { User } from '../../auth/types/types.ts';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MMUModal } from '../../../components/elements/modal.tsx';
import { CreateUserForm } from './CreateUserForm.tsx';
import { AdminCollapsibleTable } from './adminCollapsibleTable.tsx';
import { AdminSettings } from './AdminSettings.tsx';

export const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [openAddUserModal, setopenAddUserModal] = useState(false);
  const { t } = useTranslation();

  const fetchUsers = async () => {
    const users = await getAllUsers();
    setUsers(users);
  };

  const columns = [
    { label: 'ID', align: 'left' as const, sortKey: 'id' },
    { label: t('mail'), align: 'left' as const, sortKey: 'mail' },
    { label: t('name'), align: 'left' as const, sortKey: 'name' },
    { label: t('admin'), align: 'center' as const, sortKey: '_isAdmin' },
    {
      label: t('emailConfirmed'),
      align: 'center' as const,
      sortKey: 'isEmailConfirmed',
    },
    {
      label: t('terms_validated_at'),
      align: 'center' as const,
      sortKey: 'terms_validated_at',
    },
    { label: t('createdAt'), align: 'left' as const, sortKey: 'createdAt' },
  ];
  useEffect(() => {
    fetchUsers();
  }, []);

  const rows = useMemo(() => {
    return users.map((user) => ({
      id: user.id,
      data: [
        { value: String(user.id), align: 'left' as const },
        { value: user.mail, align: 'left' as const },
        { value: user.name, align: 'left' as const },
        { value: user._isAdmin ? 'Yes' : 'No', align: 'center' as const },
        {
          value: user.isEmailConfirmed ? 'Yes' : 'No',
          align: 'center' as const,
        },
        {
          value: user.termsValidatedAt ? 'Yes' : 'No',
          align: 'center' as const,
        },
        {
          value: new Date(user.createdAt).toLocaleString(),
          align: 'left' as const,
        },
      ],
    }));
  }, [users]);

  return (
    <Grid container flexDirection="column" sx={{ padding: 2 }} spacing={2}>
      <Grid>
        <AdminSettings />
      </Grid>
      <Grid container flexDirection="column" spacing={1}>
        <Grid container>
          <Grid container flexDirection="column" spacing={1}>
            <Grid>
              <Typography variant="h6" gutterBottom>
                Users
              </Typography>
            </Grid>
            <Grid>
              <Button
                variant="contained"
                onClick={() => setopenAddUserModal(!openAddUserModal)}
              >
                {t('admin_create_user')}
              </Button>
            </Grid>
          </Grid>
        </Grid>
        <Grid>
          <AdminCollapsibleTable columns={columns} rows={rows} />
        </Grid>
      </Grid>
      <MMUModal
        openModal={openAddUserModal}
        setOpenModal={setopenAddUserModal}
        width={500}
      >
        <CreateUserForm setopenAddUserModal={setopenAddUserModal} />
      </MMUModal>
    </Grid>
  );
};
