import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Settings } from '../../features/admin/types/type.ts';
import { fetchBackendAPIConnected } from '../fetchBackendAPI.ts';

export const useAdminSettings = () => {
  const { t } = useTranslation();

  return useQuery<Settings>({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      const settings: Settings = await fetchBackendAPIConnected(
        'settings',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        undefined,
        () => {
          toast.error(t('error_fetch_settings'));
        },
      );
      return settings;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
