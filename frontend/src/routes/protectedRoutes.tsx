import { Navigate } from 'react-router-dom';
import { MainContent } from '../features/miscellaneous/MainContent.tsx';
import { MiradorPublicExposed } from '../features/mirador/MIradorPublicExposed.tsx';
import { Impersonate } from '../features/admin/components/Impersonate.tsx';
import { MiradorManifestExposed } from '../features/mirador/MiradorManifestExposed';

export const protectedRoutes = [
  {
    path: '/app/my-projects',
    element: <MainContent />,
  },
  { path: '*', element: <Navigate to="/app/my-projects" /> },
  {
    path: '/mirador/*',
    element: <MiradorPublicExposed />,
  },
  {
    path: '/manifest/*',
    element: <MiradorManifestExposed />,
  },
  {
    path: '/impersonate/*',
    element: <Impersonate />,
  },
]
