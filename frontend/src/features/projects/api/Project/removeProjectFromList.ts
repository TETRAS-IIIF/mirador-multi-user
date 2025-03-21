import storage from "../../../../utils/storage.ts";

export const removeProjectFromList = async (projectId: number) => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-group-project/remove-project/${projectId}`,
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
