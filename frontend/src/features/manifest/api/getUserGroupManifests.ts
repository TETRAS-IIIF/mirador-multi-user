import { Manifest } from "../../manifest/types/types.ts";
import storage from "../../../utils/storage.ts";
import dayjs from "dayjs";

export const getUserGroupManifests = async (
  userGroupId: number,
): Promise<Manifest[]> => {
  const token = storage.getToken();

  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/link-manifest-group/group/${userGroupId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const manifests = await response.json();
  return manifests.map((manifest: any) => ({
    ...manifest,
    created_at: dayjs(manifest.created_at),
  }));
};
