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
    { label: t('admin'), align: 'left' as const, sortKey: '_isAdmin' },
    {
      label: t('emailConfirmed'),
      align: 'left' as const,
      sortKey: 'isEmailConfirmed',
    },
    {
      label: t('terms_validated_at'),
      align: 'left' as const,
      sortKey: 'terms_validated_at',
    },
    { label: t('createdAt'), align: 'left' as const, sortKey: 'createdAt' },
    {
      label: t('last_connected_at'),
      align: 'left' as const,
      sortKey: 'last_connected_at',
    },
    {
      label: t('login_count'),
      align: 'left' as const,
      sortKey: 'login_count',
    },
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
        { value: user._isAdmin ? 'Yes' : 'No', align: 'left' as const },
        {
          value: user.isEmailConfirmed ? 'Yes' : 'No',
          align: 'left' as const,
        },
        {
          value: user.termsValidatedAt
            ? new Date(user.termsValidatedAt).toLocaleDateString('fr-FR')
            : '-',
          align: 'left' as const,
        },
        {
          value: new Date(user.createdAt).toLocaleString(),
          align: 'left' as const,
        },
        { value: new Date(user.lastConnectedAt).toLocaleString() },
        { value: user.loginCounter, align: 'left' as const },
      ],
    }));
  }, [users]);

  return (
    <Grid>
      <Grid sx={{ margin: 1 }}>
        <AdminSettings />
      </Grid>
      <Grid container flexDirection="column" spacing={1}>
        <Grid container>
          <Grid container flexDirection="column" spacing={1} sx={{ margin: 1 }}>
            <Grid>
              <Typography variant="h6" gutterBottom>
                {t('users')}
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
        <Grid sx={{ margin: 1 }}>
          <AdminCollapsibleTable
            columns={columns}
            rows={rows}
            fetchUsers={fetchUsers}
          />
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
