import { Route, Routes } from 'react-router-dom';
import { Login } from './Login.tsx';
import { Register } from './Register.tsx';
import { useAdminSettings } from '../../../utils/customHooks/useAdminSettings.ts';
import { LoadingSpinner } from '../../../components/elements/loadingSpinner.tsx';
import { getSettingValue } from '../../../utils/utils.ts';

export const AuthRoutes = () => {
  const { data: settings, isLoading } = useAdminSettings();

  if (isLoading) return <LoadingSpinner />;


  const showInscription = getSettingValue('DISPLAY_USER_INSCRIPTION_PAGE', settings) === 'true';

  return (
    <Routes>
      <Route path="/login" Component={Login} />
      {showInscription && <Route path="/signin" Component={Register} />}
    </Routes>
  );
};