import storage from '../../../utils/storage.ts';

export const lookingForTags = async (partialString: string) => {
  try {
    const token = storage.getToken();
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tag/looking-for-tag/${partialString}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const toreturn = await response.json();
    return toreturn;
  } catch (error) {
    console.error(error);
  }
};
