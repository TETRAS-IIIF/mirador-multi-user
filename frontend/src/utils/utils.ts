export const isValidFileForUpload = (file: File) => {
  return !isVideoOrAudioFile(file);
};

const isVideoOrAudioFile = (file: File) => {
  return file.type.startsWith("video/") || file.type.startsWith("audio/");
};
const maxUploadSize =
  parseInt(import.meta.env.VITE_MAX_UPLOAD_SIZE, 10) * 1024 * 1024;

export const isFileSizeOverLimit = (file: File) => {
  return file.size >= maxUploadSize;
};
