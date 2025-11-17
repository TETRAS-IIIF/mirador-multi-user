import { ITEM_RIGHTS } from '../../../../utils/mmu_types.ts';
import storage from '../../../../utils/storage.ts';

export const updateAccessToProject = async (
  projectId: number,
  userGroupId: number,
  rights: ITEM_RIGHTS,
) => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-group-project/change-rights`,
      {
        method: 'PATCH',
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
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
