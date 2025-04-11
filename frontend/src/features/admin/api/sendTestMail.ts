import { useMutation } from '@tanstack/react-query';
import storage from '../../../utils/storage.ts';

const sendTestMail = async () => {
  const token = storage.getToken();

  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/email-server/test`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(response.statusText || 'Failed to send test mail');
  }

  return response;
};

export const useSendTestMail = () =>
  useMutation({
    mutationFn: sendTestMail,
  });