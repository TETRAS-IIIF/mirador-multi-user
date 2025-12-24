import { Box, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { NavLink } from 'react-router-dom';
import { ReactNode } from 'react';
import storage from '../../../utils/storage.ts';
import { TermsFooter } from '../../../../customAssets/TermsFooter.tsx';

type LayoutProps = {
  children: ReactNode;
  rightButton?: ReactNode;
  title: string;
};

export const Layout = ({ children, title, rightButton }: LayoutProps) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        component="header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, sm: 4 },
          py: { xs: 1.5, sm: 2 },
          gap: 2,
        }}
      >
        <NavLink
          to="/"
          onClick={() => {
            storage.clearToken();
          }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <ArrowBackIcon />
        </NavLink>
        <Typography
          variant="h2"
          component="h1"
          sx={{
            flexGrow: 1,
            textAlign: 'center',
            fontSize: { xs: '1.5rem', sm: '2rem' },
            px: 1,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }}
        >
          {title}
        </Typography>

        <Box
          sx={{
            minWidth: 64,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          {rightButton ?? null}
        </Box>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          px: { xs: 2, sm: 4 },
          py: { xs: 4, sm: 6 },
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 480,
          }}
        >
          {children}
        </Box>
      </Box>

      <Box
        component="footer"
        sx={{
          width: '100%',
          mt: 'auto',
        }}
      >
        <TermsFooter />
      </Box>
    </Box>
  );
};
