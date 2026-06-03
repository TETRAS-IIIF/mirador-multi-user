import { Navigate } from 'react-router-dom';
import { MainContent } from '../features/miscellaneous/MainContent.tsx';
import { MiradorPublicExposed } from '../features/mirador/MIradorPublicExposed.tsx';
import { MiradorManifestExposed } from '../features/mirador/MiradorManifestExposed';
import { MailConfirmation } from '../features/auth/components/MailConfirmation.tsx';
import { Terms } from '../features/miscellaneous/Terms.tsx';
import { Impersonate } from '../features/admin/components/Impersonate.tsx';

export const protectedRoutes = [
  {
    path: '/app/my-projects',
    element: <MainContent />,
  },
  {
    path: '/mirador/*',
    element: <MiradorPublicExposed />,
  },
  {
    path: '/manifest/*',
    element: <MiradorManifestExposed />,
  },
  {
    path: '/token/*',
    element: <MailConfirmation />,
  },
  {
    path: '/terms/*',
    element: <Terms />,
  },
  {
    path: '/impersonate/*',
    element: <Impersonate />,
  },
  { path: '*', element: <Navigate to="/app/my-projects" /> },
];
