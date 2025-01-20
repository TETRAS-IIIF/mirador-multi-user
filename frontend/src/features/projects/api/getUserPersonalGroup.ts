import storage from '../../../utils/storage.ts';
import { UserGroup } from '../../user-group/types/types.ts';

export const getUserPersonalGroup = async (userId: number): Promise<UserGroup> => {
  const token = storage.getToken();
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/link-user-group/user-personal-group/${userId}`, {
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
