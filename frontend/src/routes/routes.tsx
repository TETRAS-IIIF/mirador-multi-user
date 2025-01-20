import { Landing } from '../features/miscellaneous/Landing.tsx';
import { useRoutes } from 'react-router-dom';
import { protectedRoutes } from './protectedRoutes.tsx';
import { publicRoutes } from './publicRoutes.tsx';
import storage from '../utils/storage.ts';
import { Grid } from '@mui/material';

export function AppRoutes() {
  const token = storage.getToken();

  const commonRoutes = [{
    path: '/*',
    element: <Landing />
  }];

  let routes;
  if (token) {
    routes = protectedRoutes;
  } else {
    routes = [...publicRoutes, ...commonRoutes];
  }

  const content = useRoutes(routes);

  return (
    <Grid minHeight="100vh">
      {content}
    </Grid>
  );
}
