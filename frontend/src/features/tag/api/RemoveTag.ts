import storage from '../../../utils/storage.ts';
import { OBJECT_TYPES } from '../../../utils/types.ts';

export const removeTag = async (
  tagTitle: string,
  objectType: OBJECT_TYPES,
  objectId: number,
) => {
  try {
    const token = storage.getToken();
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/tagging/remove`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tagTitle: tagTitle,
          objectId: objectId,
          objectType: objectType,
        }),
      },
    );
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};
