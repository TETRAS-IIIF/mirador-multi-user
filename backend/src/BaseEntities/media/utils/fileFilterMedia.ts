import { UnsupportedMediaTypeException } from '@nestjs/common';

export const fileFilterMedia = (req, file, callback) => {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true);
  } else {
    callback(
      new UnsupportedMediaTypeException(
        'Audio and video files are not allowed!',
      ),
      false,
    );
  }
};
