import { AuthRoutes } from '../features/auth/routes';
import { MiradorPublicExposed } from '../features/mirador/MIradorPublicExposed.tsx';
import { MailConfirmation } from '../features/auth/components/MailConfirmation.tsx';
import { ResetPassword } from '../features/auth/components/resetPassword.tsx';
import ForgotPassword from '../features/auth/components/forgotPassword.tsx';

export const publicRoutes = [
  {
    path: '/auth/*',
    element: <AuthRoutes />
  },
  {
    path: '/mirador/*',
    element: <MiradorPublicExposed />
  },
  {
    path: '/token/*',
    element: <MailConfirmation />
  },
  {
    path: '/reset-password/*',
    element: <ResetPassword />
  },
  {
    path: '/forgot-password/*',
    element: <ForgotPassword />
  }
];
