import { useNavigate } from 'react-router-dom';
import { Grid } from '@mui/material';
import { theme } from '../../assets/theme/mainTheme.ts';
import { CustomTerms } from '../../../customAssets/CustomTerms.tsx';

export const Terms = () => {
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
      <Grid
        container
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
        }}
      >
        <Grid>
          <CustomTerms></CustomTerms>
        </Grid>
      </Grid>
    </Grid>
  );
};
