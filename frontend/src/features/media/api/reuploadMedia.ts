import storage from '../../../utils/storage.ts';

export const reuploadMedia = async (
  file: File,
  mediaId: number,
  fileName: string,
  hash: string,
) => {
  const prevExt = fileName.split('.').pop()?.toLowerCase();

  const newExt = file.name.split('.').pop()?.toLowerCase();
  console.log('check : ', !prevExt || !newExt || prevExt !== newExt);
  if (!prevExt || !newExt || prevExt !== newExt) {
    return {
      ok: false,
      status: 415,
    };
  }

  const token = storage.getToken();
  const formData = new FormData();

  formData.append('fileName', fileName);
  formData.append('mediaId', mediaId.toString());
  formData.append('hash', hash);
  formData.append('file', file);

  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-media-group/media/reupload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, status: 0 };
  }
};
