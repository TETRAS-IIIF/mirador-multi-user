import storage from "../../../utils/storage.ts";

export const getGroupsAccessToProject = async (projectId: number) => {
  const token = storage.getToken();

  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-group-project/snapshot/${projectId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const toreturn = await response.json();
    return toreturn;
  } catch (error) {
    console.error("Error in snapshot generation:", error);
  }
};
