import storage from "../../../utils/storage.ts";

export const tagging = async (tagTitle: string, objectId: number) => {
  try {
    const token = storage.getToken();
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/tagging/assign`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tagTitle,
          objectId,
        }),
      },
    );
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};
