import storage from "../../../utils/storage.ts";

export const removeManifestToGroup = async (manifestId: number, groupId:number) => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-manifest-group/manifest/${manifestId}/${groupId}`,
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
