import { useNavigate } from 'react-router-dom';
import { Grid } from '@mui/material';
import { theme } from '../../assets/theme/mainTheme.ts';

export const Consent = () => {
  useNavigate();

  return (
    <Grid
      container
      spacing={10}
      sx={{
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundImage: theme.palette.backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        marginTop: 0,
      }}
    >
      <Grid sx={{ width: '100%', height: '100%' }}>
        <Consent />
      </Grid>
    </Grid>
  );
};
