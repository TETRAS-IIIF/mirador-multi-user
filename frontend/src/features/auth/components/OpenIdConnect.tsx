import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { LoadingSpinner } from '../../../components/elements/loadingSpinner.tsx';
import storage from '../../../utils/storage.ts';

export const OpenIdConnect = () => {
  const navigate = useNavigate();
  console.log('OPEN ID CONNECT')
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));

    const accessToken = params.get('access_token');
    if (accessToken) {
      storage.setToken(accessToken);
      console.log('accessToken', accessToken);
      // navigate('/app/my-projects');
    } else {
      navigate('/login');
    }
  }, []);

  return <LoadingSpinner />;
}