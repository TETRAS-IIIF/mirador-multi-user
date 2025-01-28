import storage from "../../../utils/storage.ts";

export const removeMediaFromList = async (mediaId: number) => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-media-group/remove-media/${mediaId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    return response.json();
  } catch (error) {
    throw error;
  }
};
