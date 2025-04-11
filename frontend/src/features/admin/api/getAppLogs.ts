import storage from '../../../utils/storage.ts';
import { useMutation } from '@tanstack/react-query';

export const getAppLogs = async (): Promise<Blob> => {
  const token = storage.getToken();

  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/settings/logs`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to get app logs');
  }

  return response.blob();
};


export const useAppLogs = () => {
  return useMutation({
    mutationFn: getAppLogs,
  });
};