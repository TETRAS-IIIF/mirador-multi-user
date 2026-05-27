import storage from '../../../utils/storage.ts'; // Ajustez le chemin selon votre structure

export const getAllAnnotationsForProject = async (
  projectId: number,
  userId: number,
) => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/annotation-page/all/${projectId}/${userId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    if (!response.ok) {
      throw new Error('Failed to fetch annotations');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching annotations:', error);
    throw error;
  }
};
