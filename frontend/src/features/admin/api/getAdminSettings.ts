import storage from '../../../utils/storage.ts';
import { Settings } from '../types/type.ts';

export const getAdminSettings = async (): Promise<Settings> => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/settings`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return await response.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
};
