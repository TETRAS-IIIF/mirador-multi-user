import storage from "../../../utils/storage.ts";
import { Media } from "../types/types.ts";

export const lookingForMedias = async (
  partialString: string,
  userGroupId: number,
): Promise<Media[]> => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/media/search/${userGroupId}/${partialString}`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );
    if (response.status === 404) {
      return [];
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};
