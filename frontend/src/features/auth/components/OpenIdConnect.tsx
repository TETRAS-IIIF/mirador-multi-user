import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { LoadingSpinner } from '../../../components/elements/loadingSpinner.tsx';
import { useOpenIdLogin } from '../api/useOpenIdLogin.ts';

export const OpenIdConnect = () => {
  const navigate = useNavigate();
  const { mutateAsync } = useOpenIdLogin();
  const hasRun = useRef(false);
  useEffect(() => {
    const tryToIdentify = async () => {
      if (hasRun.current) return;
      hasRun.current = true;

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const redirectUri = window.location.origin + '/auth/openId-callback';

      if (!code) {
        navigate('/login');
        return;
      }
      try {
        await mutateAsync({ code, redirectUri });
        navigate('/app/my-projects');
      } catch (err) {
        console.log(err);
        navigate('/login');
      }
    };

    tryToIdentify();
  }, []);

  return <LoadingSpinner />;
};
