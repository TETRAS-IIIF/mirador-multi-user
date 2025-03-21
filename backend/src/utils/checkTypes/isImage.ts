export function isImage(file: Express.Multer.File): boolean {
  return file.mimetype?.startsWith('image/');
}
