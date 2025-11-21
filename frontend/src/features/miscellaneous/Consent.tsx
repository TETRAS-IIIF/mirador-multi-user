import { useNavigate } from 'react-router-dom';
import { Grid } from '@mui/material';
import { theme } from '../../assets/theme/mainTheme.ts';

export const Consent = () => {
  useNavigate();

  return (
    <Grid
      container
      direction="column"
      justifyContent="center"
      alignItems="center"
      spacing={10}
      minHeight={'100vh'}
      sx={{
        backgroundImage: theme.palette.backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        marginTop: 0,
      }}
    >
      <Grid width={'100%'} height={'100%'}>
        <Consent />
      </Grid>
    </Grid>
  );
};
