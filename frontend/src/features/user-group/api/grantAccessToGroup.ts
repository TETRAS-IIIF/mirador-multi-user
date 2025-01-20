import storage from '../../../utils/storage.ts';
import { UserGroup } from '../types/types.ts';
import { User } from '../../auth/types/types.ts';

export const grantAccessToGroup = async (user: User, user_group: UserGroup) => {
  const token = storage.getToken();
  try {
    const payload = {
      userId: user.id,
      user_groupId: user_group.id
    };

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/link-user-group/access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};
