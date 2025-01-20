import storage from '../../../utils/storage.ts';

export const createTag = async (name: string) => {
  try {
    const token = storage.getToken();
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tag`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name
      })
    });
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};
