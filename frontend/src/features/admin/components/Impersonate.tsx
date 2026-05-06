import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { handleImpersonationCallback } from '../api/initiateImpersonation.ts';

export const Impersonate = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const impersonate = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const userId = params.get('userId');

      if (token && userId) {
        try {
          await handleImpersonationCallback(token, Number(userId));
        } catch (error) {
          console.error('Failed to impersonate user:', error);
          navigate('/');
        }
      } else {
        navigate('/');
      }
    };

    impersonate();
  }, []);

  return <div>{t('loadingImpersonate')}</div>;
};
