export const isValidFileForUpload = (file: File) => {
  return !isVideoOrAudioFile(file);
};

const isVideoOrAudioFile = (file: File) => {
  const videoOrAudioExtensions =
    /\.(mp4|mov|avi|wmv|flv|mkv|webm|mpg|mpeg|3gp|ogg|ogv|m4v|mp3|wav|aac|flac|m4a|wma)$/i;

  return (
    file.type.startsWith("video/") ||
    file.type.startsWith("audio/") ||
    videoOrAudioExtensions.test(file.name)
  );
};
const maxUploadSize =
  parseInt(import.meta.env.VITE_MAX_UPLOAD_SIZE, 10) * 1024 * 1024;

export const isFileSizeUnderLimit = (file: File) => {
  return file.size >= maxUploadSize;
};

export const MENU_ELEMENT = {
  PROJECTS: "PROJECT",
  GROUPS: "GROUPS",
  MEDIA: "MEDIA",
  MANIFEST: "MANIFEST",
  SETTING: "SETTING",
  ADMIN: "ADMIN",
};
