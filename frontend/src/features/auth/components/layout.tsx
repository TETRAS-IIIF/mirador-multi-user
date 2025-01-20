import { Grid, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { NavLink } from 'react-router-dom';
import { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
  rightButton?: ReactNode;
  title: string;
};

export const Layout = ({ children, title, rightButton }: LayoutProps) => {
  return (
    <Grid
      container
      direction="column"
      justifyContent="space-around"
      alignItems="center"
      min-height="100vh"
      sx={{
        height: '100%'
      }}
    >
      <Grid
        item
        container
        direction="row"
        justifyContent="space-around"
        alignItems="center"
      >
        <Grid item>
          <NavLink to="/">
            <ArrowBackIcon />
          </NavLink>
        </Grid>
        <Grid item>
          <Typography
            variant="h2"
            component="h1"
          >
            {title}
          </Typography>
        </Grid>
        {rightButton ? (
          rightButton
        ) : (
          <Grid>
          </Grid>
        )
        }
      </Grid>
      <Grid item container
            direction="column"
            justifyContent="center"
            alignItems="center"
            minHeight="80vh"
      >
        {children}
      </Grid>
    </Grid>
  );
};
