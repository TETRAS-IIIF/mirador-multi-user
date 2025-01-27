import storage from "../../../utils/storage.ts";

export const deleteMedia = async (mediaId: number) => {
  const token = storage.getToken();

  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/link-media-group/media/${mediaId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return await response.json();
};
