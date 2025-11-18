import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { LoadingSpinner } from '../../../components/elements/loadingSpinner.tsx';
import { useOpenIdConnectLogin } from '../hooks/useOpenIdConnectLogin.ts';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const OpenIdConnect = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { mutateAsync: tryToConnectWithOpenIdConnect } =
    useOpenIdConnectLogin();
  const hasRun = useRef(false);

  useEffect(() => {
    const tryToIdentify = async () => {
      if (hasRun.current) return;
      hasRun.current = true;

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const redirectUri = `${window.location.origin}/auth/openId-callback`;

      if (!code) {
        navigate('/login');
        return;
      }

      try {
        await tryToConnectWithOpenIdConnect({ code, redirectUri });
        navigate('/app/my-projects');
      } catch (err) {
        toast.error(t('error_openIdConnect_failure'));
        console.error('❌ OIDC login failed:', err);
        navigate('/login');
      }
    };

    tryToIdentify();
  }, []);

  return <LoadingSpinner />;
};
