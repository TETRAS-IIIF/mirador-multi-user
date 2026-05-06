import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleImpersonationCallback } from '../api/initiateImpersonation.ts';
import { useTranslation } from 'react-i18next';

export const Impersonate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  useEffect(() => {
    const token = searchParams.get('token');
    const userId = Number(searchParams.get('userId'));
    if (token && userId) {
      handleImpersonationCallback(token, userId).catch((error) => {
        console.error('Failed to impersonate user:', error);
        navigate('/');
      });
    } else {
      navigate('/');
    }
  }, []);

  return <div>{t('loadingImpersonate')}</div>;
};
