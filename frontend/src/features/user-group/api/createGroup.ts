import storage from '../../../utils/storage.ts';
import { CreateGroupDto } from '../types/types.ts';

export const createGroup = async (userGroup: CreateGroupDto) => {
  const token = storage.getToken();

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/link-user-group/group`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...userGroup })
      });
    return await response.json();
  } catch (error) {
    throw error;
  }
};
