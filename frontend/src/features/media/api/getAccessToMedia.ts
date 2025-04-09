import { ProjectGroup } from '../../projects/types/types.ts';
import storage from '../../../utils/storage.ts';

export const getAccessToMedia = async (
  mediaId: number,
): Promise<ProjectGroup[]> => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-media-group/media/${mediaId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!response.ok) {
      throw new Error(`Error in getALlMediaGroups: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getALlMediaGroups:", error);
    return [];
  }
};
