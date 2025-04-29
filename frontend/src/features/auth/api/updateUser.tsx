import { UpdateUserDto } from '../types/types.ts';
import storage from '../../../utils/storage.ts';

export const updateUser = async (updateUserDto: UpdateUserDto) => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/users/update`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateUserDto),
      },
    );
    if (!response.ok) {
      const error = new Error('Failed to update user');
      (error as any).status = response.status;
      throw error;
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};
