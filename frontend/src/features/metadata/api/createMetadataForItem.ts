import storage from '../../../utils/storage.ts';
import { OBJECT_TYPES } from '../../../utils/types.ts';

export const createMetadataForItem = async (
  objectTypes: OBJECT_TYPES,
  objectId: number,
  metadataFormatTitle: string,
  metadata: any,
  ownerId: number,
) => {
  const token = storage.getToken();
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/metadata`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      objectTypes: objectTypes,
      objectId: objectId,
      metadataFormatTitle: metadataFormatTitle,
      metadata: metadata,
      ownerId: ownerId,
    }),
  });
  return await response.json();
};
