import storage from '../../../utils/storage.ts';
import { UserGroup } from '../types/types.ts';
import dayjs from 'dayjs';

export const getAllUserGroups = async (userId: number) => {
  const token = storage.getToken();
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/link-user-group/groups/${userId}`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    const toReturn = await response.json();
    return toReturn.map((group: UserGroup) => ({
      ...group,
      created_at: dayjs(group.created_at)
    }));
  } catch (error) {
    throw error;
  }
};
