import storage from '../../../utils/storage.ts';
import { User } from '../types/types.ts';
import { ErrorCode } from '../../../utils/error.code.ts';

export const getUser = async (): Promise<User> => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/auth/profile`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || 'Failed to fetch user') as any;

      if (data?.code) {
        error.code = data.code;
      } else {
        error.code = response.status;
      }

      throw error;
    }

    return data;
  } catch (error: any) {
    if (error.code === ErrorCode.EMAIL_NOT_CONFIRMED) {
      return Promise.reject(error);
    }
    if (error.code !== ErrorCode.EMAIL_NOT_CONFIRMED) {
      storage.clearToken();
      window.location.reload();
    }
    throw error;
  }
};
