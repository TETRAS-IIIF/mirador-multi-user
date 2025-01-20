import storage from '../../../utils/storage.ts';
import { grantAccessToManifestDto } from '../types/types.ts';

export const grantAccessToManifest = async (grantAccessToManifestDto: grantAccessToManifestDto) => {
  const token = storage.getToken();
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/link-manifest-group/manifest/add`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(grantAccessToManifestDto)
      }
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error granting access to manifest:', error);
    throw error;
  }
};
