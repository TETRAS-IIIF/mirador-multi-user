import { UnsupportedMediaTypeException } from '@nestjs/common';

export const fileFilterMedia = (req, file, callback) => {
  const excludedMimeTypes = ['video/', 'audio/'];
  if (excludedMimeTypes.some((type) => file.mimetype.startsWith(type))) {
    callback(
      new UnsupportedMediaTypeException(
        'Audio and video files are not allowed!',
      ),
      false,
    );
  } else {
    callback(null, true);
  }
};
