import storage from '../../../utils/storage.ts';
import { LinkMediaDto } from '../types/types.ts';

export const createMediaLink = async (mediaLinkDto: LinkMediaDto) => {
  const token = storage.getToken();
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/link-media-group/media/link`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mediaLinkDto),
    },
  );

  if (!response.ok) {
    if (response.status === 400) {
      const errorBody = await response.json();
      console.log('errorBody : ', errorBody);
      throw new Error(errorBody.message);
    }
    throw new Error('media_creation_failed');
  }

  return await response.json();
};
