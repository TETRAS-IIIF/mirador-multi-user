export const isValidFileForUpload = (file: File) => {
  return isImageFile(file);
};

const isImageFile = (file: File) => {
  return !!file.name.match(
    /\.(jpg|jpeg|png|webp|gif|bmp|tiff|svg|ico|jfif|heic|heif)$/i,
  );
};
