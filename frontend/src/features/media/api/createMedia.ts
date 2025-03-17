import storage from '../../../utils/storage.ts';
import { CreateMediaDto } from '../types/types.ts';
import toast from 'react-hot-toast';

export const createMedia = async (
  mediaDto: CreateMediaDto,
  t: (key: string) => string,
) => {
  const token = storage.getToken();
  const formData = new FormData();

  formData.append("file", mediaDto.file);
  formData.append("idCreator", mediaDto.idCreator.toString());
  formData.append("user_group", JSON.stringify(mediaDto.user_group));

  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/link-media-group/media/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      if (response.status === 413) {
        toast.error(t("mediaTooLarge"));
      } else {
        toast.error(t("unsupportedMedia"));
      }
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading media:", error);
    throw error;
  }
};
