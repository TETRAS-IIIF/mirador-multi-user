import storage from "../../../utils/storage.ts";

export const removeManifestFromList = async (manifestId: number) => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-manifest-group/remove-manifest/${manifestId}`,
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
