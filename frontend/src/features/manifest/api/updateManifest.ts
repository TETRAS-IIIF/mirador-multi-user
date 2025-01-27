import { Manifest } from "../types/types.ts";
import storage from "../../../utils/storage.ts";

export const updateManifest = async (manifest: Manifest) => {
  const token = storage.getToken();
  const { json, ...manifestToUpdate } = manifest;
  try {
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
    const toReturn = await response.json();
    return toReturn;
  } catch (error) {
    throw error;
  }
};
