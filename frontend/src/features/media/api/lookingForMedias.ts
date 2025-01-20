import storage from '../../../utils/storage.ts';
import { Media } from '../types/types.ts';

export const lookingForMedias = async (partialString: string, userGroupId: number): Promise<Media[]> => {
  const token = storage.getToken();
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/media/search/${userGroupId}/${partialString}`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    const toReturn = await response.json();
    return toReturn;
  } catch (error) {
    throw error;
  }
};
