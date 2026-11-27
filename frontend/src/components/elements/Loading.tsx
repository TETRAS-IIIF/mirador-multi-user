import { CircularProgress, Grid } from '@mui/material';

export const Loading = () => {
  return (
    <Grid
      container
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
      }}
    >
      <CircularProgress />
    </Grid>
  );
};
