import { updateManifestJsonDto } from '../types/types.ts';
import storage from '../../../utils/storage.ts';

export const updateManifestJson = async (manifest: updateManifestJsonDto) => {
  const token = storage.getToken();
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/link-manifest-group/manifest/updateJson`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(manifest)
    });
    const toReturn = await response.json();
    return toReturn;
  } catch (error) {
    throw error;
  }
};
