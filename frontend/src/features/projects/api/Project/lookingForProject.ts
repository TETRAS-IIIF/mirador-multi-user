import storage from "../../../../utils/storage.ts";
import { ProjectUser } from "../../types/types.ts";

export const lookingForProject = async (
  partialProjectName: string,
  userGroupId: number,
): Promise<ProjectUser[]> => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-group-project/search/${userGroupId}/${partialProjectName}`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );
    const toReturn = await response.json();
    return toReturn;
  } catch (error) {
    throw error;
  }
};
