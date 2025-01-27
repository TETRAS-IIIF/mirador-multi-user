import storage from "../../../utils/storage.ts";

export const addMediaToGroup = async (mediaId: number, userGroupId: number) => {
  const token = storage.getToken();
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/link-media-group/media/add`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mediasId: [mediaId], userGroupId: userGroupId }),
    },
  );
  return response.json();
};
