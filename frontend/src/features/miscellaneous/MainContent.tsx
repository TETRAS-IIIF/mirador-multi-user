import { useLogout, useUser } from '../../utils/auth.tsx';
import { Grid } from '@mui/material';
import { SideDrawer } from '../../components/elements/SideDrawer.tsx';
import { Loading } from '../../components/elements/Loading.tsx';
import { useState } from 'react';
import { NotConfirmedAccount } from '../auth/components/NotConfirmedAccount.tsx';

export const MainContent = () => {
  const user = useUser();
  const logout = useLogout({});
  const [selectedProjectId, setSelectedProjectId] = useState<
    number | undefined
  >(undefined);
  console.log('MAIN CONTENT')
  const [viewer, setViewer] = useState<any>(undefined);
  if (!user || !user.data) {
    return <Loading />;
  }

  if (!user.data.id) {
    return <NotConfirmedAccount />;
  }

  const handleDisconnect = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.assign(window.location.origin);
      },
    });
  };
  return (
    <Grid container direction="row" sx={{ padding: 0 }}>
      <SideDrawer
        user={user.data}
        handleDisconnect={handleDisconnect}
        viewer={viewer}
        setViewer={setViewer}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
      />
    </Grid>
  );
};
