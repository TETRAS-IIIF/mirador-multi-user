import { Manifest } from '../types/types.ts';
import storage from "../../../utils/storage.ts";
import dayjs from "dayjs";

export const getUserManifests = async (
): Promise<Manifest[]> => {
  const token = storage.getToken();

  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/link-manifest-group/manifests`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const manifests = await response.json();
  return manifests.map((manifest: Manifest) => ({
    ...manifest,
    created_at: dayjs(manifest.created_at),
    updated_at: dayjs(manifest.updated_at),
  }));
};
