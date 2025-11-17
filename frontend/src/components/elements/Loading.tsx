import { CircularProgress, Grid } from '@mui/material';

export const Loading = () => {
  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      sx={{ height: '100vh', width: '100vw' }}
    >
      <CircularProgress />
    </Grid>
  );
};
