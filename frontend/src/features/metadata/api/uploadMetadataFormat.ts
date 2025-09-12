import storage from '../../../utils/storage.ts';

export const uploadMetadataFormat = async (
  title: string,
  metadata: any,
  creatorId: number,
) => {
  const token = storage.getToken();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-metadata-format-group/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          metadata: metadata,
          creatorId: creatorId,
        }),
      },
    );
    const toreturn = await response.json();
    return toreturn;
  } catch (error) {
    console.error('Error while uploading metadata:', error);
  }
};
