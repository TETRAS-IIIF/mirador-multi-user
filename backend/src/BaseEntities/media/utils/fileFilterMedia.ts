import { UnsupportedMediaTypeException } from '@nestjs/common';

export const fileFilterMedia = (req, file, callback) => {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true);
  } else {
    callback(
      new UnsupportedMediaTypeException('Only image files are allowed!'),
      false,
    );
  }
};
