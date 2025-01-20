import { Grid, Typography } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface CloseButtonProps {
  text: string;
}

export const OpenButton = ({ text }: CloseButtonProps) => {
  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      sx={{
        backgroundColor: '#fff',
        padding: '5px',
        borderRadius: 1,
        transformOrigin: '0 0',
        transform: 'rotate(-90deg)'
      }}
    >
      <Typography variant="body2" color="textSecondary" align="center">{text}</Typography>
      <ExpandLessIcon />
    </Grid>
  );
};
