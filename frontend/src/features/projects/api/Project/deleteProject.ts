import storage from "../../../../utils/storage.ts";

export const deleteProject = async (projectId: number) => {
  const token = storage.getToken();

  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/link-group-project/delete/project/${projectId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.json();
};
