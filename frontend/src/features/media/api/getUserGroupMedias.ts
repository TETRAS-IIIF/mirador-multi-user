import storage from '../../../utils/storage.ts';
import { Media } from '../types/types.ts';

export const getUserGroupMedias = async (
  userGroupId: number,
): Promise<Media[]> => {
  const token = storage.getToken();

  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/link-media-group/group/${userGroupId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return await response.json();
};
