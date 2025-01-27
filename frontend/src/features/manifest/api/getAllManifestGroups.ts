import { ProjectGroup } from "../../projects/types/types.ts";
import storage from "../../../utils/storage.ts";

export const getAllManifestGroups = async (
  manifestId: number,
): Promise<ProjectGroup[]> => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-manifest-group/manifest/${manifestId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!response.ok) {
      throw new Error(`Error fetching groups: ${response.statusText}`);
    }

    const toreTurn = await response.json();
    return toreTurn;
  } catch (error) {
    console.error("Error in getGroupsAccessToManifest:", error);
    return [];
  }
};
