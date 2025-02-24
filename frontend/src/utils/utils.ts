export const isValidFileForUpload = (file: File) => {
  return isImageFile(file);
};

const isImageFile = (file: File) => {
  return !!file.name.match(
    /\.(jpg|jpeg|png|webp|gif|bmp|tiff|svg|ico|jfif|heic|heif)$/i,
  );
};

const maxUploadSize =
  parseInt(import.meta.env.VITE_MAX_UPLOAD_SIZE, 10) * 1024 * 1024;

export const isFileSizeUnderLimit = (file: File) => {
  return file.size >= maxUploadSize;
};
