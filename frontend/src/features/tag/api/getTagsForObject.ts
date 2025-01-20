import storage from '../../../utils/storage.ts';

export const getTagsForObject = async (objectId: number) => {
  try {
    const token = storage.getToken();
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tagging/tags-for-object/${objectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};
