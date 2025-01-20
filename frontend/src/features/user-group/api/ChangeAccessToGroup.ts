import storage from '../../../utils/storage.ts';
import { changeAccessToGroupDto } from '../types/types.ts';

export const ChangeAccessToGroup = async (groupId: number, updateData: changeAccessToGroupDto) => {
  try {
    const token = storage.getToken();
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/link-user-group/change-access`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rights: updateData.rights,
        userId: updateData.userId,
        groupId: groupId
      })
    });
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};
