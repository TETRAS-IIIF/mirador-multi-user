import storage from '../../../utils/storage.ts';
import { useMutation } from '@tanstack/react-query';

const validTerms = async () => {
  try {
    const token = storage.getToken();

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/users/validTerms`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.status;
  } catch (error) {
    console.error('Network error:', error);
    return 500;
  }
};

export const useValidTerms = (opts?: {
  onSuccess?: () => void;
  onError?: (e: unknown) => void;
}) => {
  return useMutation({
    mutationFn: validTerms,
    ...opts,
  });
};
