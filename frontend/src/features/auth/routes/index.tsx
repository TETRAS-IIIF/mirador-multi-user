import { Route, Routes } from 'react-router-dom';
import { Login } from './Login.tsx';
import { Register } from './Register.tsx';
import { useAdminSettings } from '../../../utils/customHooks/useAdminSettings.ts';
import { LoadingSpinner } from '../../../components/elements/loadingSpinner.tsx';

export const AuthRoutes = () => {
  const { data: settings, isLoading } = useAdminSettings();

  if (isLoading) return <LoadingSpinner />;

  const getSettingValue = (key: string) =>
    settings?.mutableSettings.find((s) => s.key === key)?.value ??
    settings?.unMutableSettings.find(([k]) => k === key)?.[1];

  const showInscription = getSettingValue('DISPLAY_USER_INSCRIPTION_PAGE') === 'true';

  return (
    <Routes>
      <Route path="/login" Component={Login} />
      {showInscription && <Route path="/signin" Component={Register} />}
    </Routes>
  );
};