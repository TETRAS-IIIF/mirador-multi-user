import storage from "../../../utils/storage.ts";
import { CreateProjectDto, Project, ProjectUser } from "../types/types.ts";

export const createProject = async (
  project: CreateProjectDto,
): Promise<Project> => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-group-project/project`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...project }),
      },
    );
    const projectUser: ProjectUser = await response.json();
    return projectUser.project;
  } catch (error) {
    throw error;
  }
};
