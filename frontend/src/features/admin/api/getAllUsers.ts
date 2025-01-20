import { User } from '../../auth/types/types.ts';
import storage from '../../../utils/storage.ts';

export const getAllUsers = async (): Promise<User[]> => {
  const token = storage.getToken();
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/link-user-group/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    const users = await response.json();
    return users;
  } catch (error) {
    storage.clearToken();
    throw error;
  }
};
