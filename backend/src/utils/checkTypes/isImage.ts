export function isImage(file: Express.Multer.File): boolean {
  const imageExtensions =
    /\.(jpg|jpeg|png|webp|gif|bmp|tiff|svg|ico|jfif|heic|heif)$/i;
  const imageMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    'image/x-icon',
    'image/jfif',
    'image/heif',
    'image/heic',
  ];
  return (
    imageExtensions.test(file.originalname) &&
    imageMimeTypes.includes(file.mimetype)
  );
}
