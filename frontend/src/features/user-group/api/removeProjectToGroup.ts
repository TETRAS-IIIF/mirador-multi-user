import storage from '../../../utils/storage.ts';
import { RemoveProjectToGroupDto } from '../types/types.ts';

export const removeProjectToGroup = async (dto: RemoveProjectToGroupDto) => {
  const token = storage.getToken();
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/link-group-project/project/${dto.projectId}/${dto.groupId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  } catch (error) {
    throw error;
  }
};
