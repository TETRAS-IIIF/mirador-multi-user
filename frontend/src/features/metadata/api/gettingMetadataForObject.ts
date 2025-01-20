import storage from '../../../utils/storage.ts';
import { ObjectTypes } from '../../tag/type.ts';

export const gettingMetadataForObject = async (objectId: number, objectType: ObjectTypes) => {
  const token = storage.getToken();
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/metadata/${objectType}/${objectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error(`Error getting metadata: ${response.statusText}`);
    }

    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error('Error getting metadata:', error);
    return [];
  }
};
