import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { handleImpersonationCallback } from '../api/initiateImpersonation.ts';

export const Impersonate = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const impersonate = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const userId = params.get('userId');

      if (token && userId) {
        try {
          await handleImpersonationCallback(token, Number(userId));
          navigate('/app/my-projects');
        } catch (error) {
          console.error('Failed to impersonate user:', error);
        }
      }
    };

    impersonate();
  }, []);

  return <div>{t('loadingImpersonate')}</div>;
};
