import { Route, Routes } from 'react-router-dom';
import { Login } from './Login.tsx';
import { Register } from './Register.tsx';
import { useAdminSettings } from '../../../utils/customHooks/useAdminSettings.ts';
import { LoadingSpinner } from '../../../components/elements/loadingSpinner.tsx';
import { getSettingValue, SettingKeys } from '../../../utils/utils.ts';
import { OpenIdConnect } from '../components/OpenIdConnect.tsx';

export const AuthRoutes = () => {
  const { data: settings, isLoading } = useAdminSettings();

  if (isLoading) return <LoadingSpinner/>;

  const showInscription =
    getSettingValue(SettingKeys.ALLOW_NEW_USER, settings) === 'true';

  return (
    <Routes>
      <Route path="/login" Component={Login}/>
      {showInscription && <Route path="/signin" Component={Register}/>}
      <Route path="/openId-callback" element={<OpenIdConnect/>}/>
    </Routes>
  );
};
