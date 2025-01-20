import storage from '../../../utils/storage.ts';

export const updatePreferredLanguage = async (userId: number, preferredLanguage: string) => {
  try {
    const token = storage.getToken();
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/link-user-group/updateLanguage/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferredLanguage })
      });

      return await response.json();
    } catch (error) {
      storage.clearToken();
      throw error;
    }
  } catch (error: any) {
    console.error(error.message);
    throw new error;
  }
};
