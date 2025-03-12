import { Manifest } from "../types/types.ts";
import storage from "../../../utils/storage.ts";

export const updateManifest = async (manifest: Manifest) => {
  const token = storage.getToken();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { json, shared, share, ...manifestToUpdate } = manifest;
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/link-manifest-group/manifest`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(manifestToUpdate),
    },
  );
  return await response.json();
};
