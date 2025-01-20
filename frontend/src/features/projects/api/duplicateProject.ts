import storage from '../../../utils/storage.ts';

export const duplicateProject = async (projectId: number) => {
  const token = storage.getToken();
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/link-group-project/project/duplicate/${projectId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await response.json();
  } catch (error) {
    throw error;
  }
};
