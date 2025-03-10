import storage from "../../../utils/storage.ts";
import { Media } from "../types/types";

export const updateMedia = async (mediaToUpdate: Media) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { share,shared, ...mediaDto } = mediaToUpdate;
  const token = storage.getToken();

  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-media-group/media`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mediaDto),
      },
    );
    const toReturn = await response.json();
    return toReturn;
  } catch (error) {
    throw error;
  }
};
