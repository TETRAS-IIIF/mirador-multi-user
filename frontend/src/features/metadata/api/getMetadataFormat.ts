import storage from '../../../utils/storage.ts';

export const getMetadataFormat = async (userId: number) => {
  const token = storage.getToken();
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/link-metadata-format-group/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error(`Error getting metadata: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting metadata:', error);
    return [];
  }
};
