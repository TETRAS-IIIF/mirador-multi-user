import { ProjectGroup } from "../../projects/types/types.ts";
import storage from "../../../utils/storage.ts";
import dayjs from "dayjs";

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

    const manifests = await response.json();
    return manifests.map((manifest: any) => ({
      ...manifest,
      created_at: dayjs(manifest.created_at),
      updated_at: dayjs(manifest.updated_at),
    }));
  } catch (error) {
    console.error("Error in getGroupsAccessToManifest:", error);
    return [];
  }
};
