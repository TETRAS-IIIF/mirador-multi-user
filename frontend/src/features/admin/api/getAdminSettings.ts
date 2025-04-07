import storage from '../../../utils/storage.ts';

export const getAdminSettings = async () => {
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
    throw error;
  }
};
