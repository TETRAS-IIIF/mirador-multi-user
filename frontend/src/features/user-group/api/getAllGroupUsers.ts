import storage from '../../../utils/storage.ts';
import { UserGroup } from '../types/types.ts';
import dayjs from 'dayjs';

export const GetAllGroupUsers = async (groupId: number) => {
  try {
    const token = storage.getToken();
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/link-user-group/users/${groupId}`, {
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
