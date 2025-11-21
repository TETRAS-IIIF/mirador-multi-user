import * as path from 'path';

export function isImage(file?: Express.Multer.File): boolean {
  if (!file) return false;

  const mimeOk = file.mimetype?.startsWith('image/');

  const name = file.originalname || file.filename || '';
  const ext = path.extname(name).toLowerCase();
  const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const extOk = allowedExt.includes(ext);

  return Boolean(mimeOk || extOk);
}
