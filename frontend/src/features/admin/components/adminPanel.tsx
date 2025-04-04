import { Grid } from '@mui/material';
import { getAllUsers } from '../api/getAllUsers.ts';
import { User } from '../../auth/types/types.ts';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminExpandableContent } from './adminExpandableContent.tsx';
import { AdminCollapsibleTable } from './adminCollapsibleTable.tsx';

export const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
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
    { label: t('createdAt'), align: 'left' as const, sortKey: 'createdAt' },
  ];
  useEffect(() => {
    fetchUsers();
  }, []);

  const rows = useMemo(() => {
    return users.map((user) => ({
      id: user.id,
      data: [
        { value: user.id, align: 'left' as const },
        { value: user.mail, align: 'left' as const },
        { value: user.name, align: 'left' as const },
        { value: user._isAdmin ? 'Yes' : 'No', align: 'center' as const },
        {
          value: user.isEmailConfirmed ? 'Yes' : 'No',
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
    <Grid sx={{ padding: 2 }}>
      <AdminCollapsibleTable
        columns={columns}
        rows={rows}
        renderExpandableContent={AdminExpandableContent}
      />
    </Grid>
  );
};
