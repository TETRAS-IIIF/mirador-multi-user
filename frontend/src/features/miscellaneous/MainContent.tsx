import { useLogout, useUser } from '../../utils/auth.tsx';
import { Box, Grid } from '@mui/material';
import { SideDrawer } from '../../components/elements/SideDrawer.tsx';
import { useState } from 'react';
import { NotConfirmedAccount } from '../auth/components/NotConfirmedAccount.tsx';
import { ErrorCode } from '../../utils/error.code.ts';
import { ValidateTerms } from '../auth/components/validateTerms.tsx';
import { LoadingSpinner } from '../../components/elements/loadingSpinner.tsx';

export const MainContent = () => {
  const user = useUser();
  const logout = useLogout({});
  const [selectedProjectId, setSelectedProjectId] = useState<
    number | undefined
  >(undefined);
  const [viewer, setViewer] = useState<any>(undefined);

  const handleSetProjectId = (id: number | undefined) => {
    setSelectedProjectId(id);
  };

  if (user.isError) {
    const error = user.error as { code?: string };
    if (error.code === ErrorCode.EMAIL_NOT_CONFIRMED) {
      return <NotConfirmedAccount />;
    }
  }
  if (!user?.data) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <LoadingSpinner />
      </Box>
    );
  }
  if (!user.data.termsValidatedAt) {
    return <ValidateTerms />;
  }

  if (!user.data.id) {
    return <NotConfirmedAccount />;
  }

  const handleDisconnect = () => {
    logout.mutate({});
  };
  return (
    <Grid container direction="row" sx={{ padding: 0 }}>
      <SideDrawer
        user={user.data}
        handleDisconnect={handleDisconnect}
        viewer={viewer}
        setViewer={setViewer}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={handleSetProjectId}
      />
    </Grid>
  );
};
