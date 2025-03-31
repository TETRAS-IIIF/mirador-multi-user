import { ManifestGroupRights } from '../types/types.ts';
import storage from '../../../utils/storage.ts';

export const updateAccessToManifest = async (
  manifestId: number,
  userGroupId: number,
  rights: ManifestGroupRights,
) => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-manifest-group/relation`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          manifestId: manifestId,
          userGroupId: userGroupId,
          rights: rights,
        }),
      },
    );
    return await response.json();
  } catch (error) {
    throw error;
  }
};
