import { AddProjectToGroupDto } from "../types/types.ts";
import storage from "../../../utils/storage.ts";

export const addProjectToGroup = async (dto: AddProjectToGroupDto) => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-group-project/project/add`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: dto.projectId,
          groupId: dto.groupId,
        }),
      },
    );
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};
