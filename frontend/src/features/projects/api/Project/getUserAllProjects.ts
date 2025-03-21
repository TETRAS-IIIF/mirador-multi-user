import storage from "../../../../utils/storage.ts";
import dayjs from "dayjs";

export const getUserAllProjects = async (userPersonalGroupId: number) => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-group-project/user/projects/${userPersonalGroupId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const projectData = await response.json();

    //convert created_at to dayJS for materialUI input in editModal
    return projectData.map((project: any) => ({
      ...project,
      created_at: dayjs(project.created_at),
      updated_at: dayjs(project.updated_at),
    }));
  } catch (error) {
    throw error;
  }
};
