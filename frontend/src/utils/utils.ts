export const isValidType = (mediaName: string) => {
  console.log("toto");
  if (
    !mediaName.match(
      /\.(jpg|jpeg|png|webp|gif|bmp|tiff|svg|ico|jfif|heic|heif)$/i,
    )
  ) {
    return false;
  } else {
    return true;
  }
};
