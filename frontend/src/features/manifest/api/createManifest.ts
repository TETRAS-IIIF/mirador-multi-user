import storage from "../../../utils/storage.ts";
import { manifestCreationDto } from "../types/types.ts";
import toast from "react-hot-toast";

export const createManifest = async (
  createManifestDto: manifestCreationDto,
) => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-manifest-group/manifest/creation`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createManifestDto),
      },
    );
    const manifest = await response.json();
    if (!response.ok) {
      if (response.status === 400) {
        toast.error(manifest.message);
        throw new Error("invalid format");
      }
      throw new Error(`Error: ${response.statusText}`);
    }
    return manifest;
  } catch (error) {
    throw error;
  }
};
