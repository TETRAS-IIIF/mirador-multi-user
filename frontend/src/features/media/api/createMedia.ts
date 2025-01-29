import storage from "../../../utils/storage.ts";
import { CreateMediaDto } from "../types/types.ts";
import toast from "react-hot-toast";

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
      if (response.statusText === "Payload Too Large") {
        // TODO The message should be more user-friendly and say the maximum size allowed
        toast.error(t("mediaTooLarge"));
      } else {
        // TODO The message should be more user-friendly
        // Be specific if the error come from unsupported image format or from video media
        toast.error(t("unsupportedMedia"));
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error uploading media:", error);
    throw error;
  }
};
