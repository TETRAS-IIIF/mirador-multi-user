import storage from '../../../utils/storage.ts';
import { ItemsRights } from '../../user-group/types/types.ts';

export const updateAccessToProject = async (
  projectId: number,
  userGroupId: number,
  rights: ItemsRights,
) => {
  const token = storage.getToken();
  try {
    console.log("updateAccessToProject)")
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-group-project/change-rights`,
      {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: projectId,
          rights: rights,
          groupId: userGroupId,
        }),
      },
    );
    return await response.json();
  } catch (error) {
    throw error;
  }
};
