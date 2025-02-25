import { UnsupportedMediaTypeException } from '@nestjs/common';

export const fileFilterMedia = (req, file, callback) => {
  // MIME types to exclude (video and audio)
  const excludedMimeTypes = ['video/', 'audio/'];

  // File extensions to exclude (video and audio)
  const excludedExtensions =
    /\.(mp4|mov|avi|wmv|flv|mkv|webm|mpg|mpeg|3gp|ogg|ogv|m4v|mp3|wav|aac|flac|m4a|wma)$/i;

  // Check if the MIME type starts with an excluded type
  if (excludedMimeTypes.some((type) => file.mimetype.startsWith(type))) {
    return callback(
      new UnsupportedMediaTypeException(
        'Audio and video files are not allowed!',
      ),
      false,
    );
  }

  // Check if the file extension matches any excluded formats
  if (excludedExtensions.test(file.originalname)) {
    return callback(
      new UnsupportedMediaTypeException(
        'Audio and video files are not allowed!',
      ),
      false,
    );
  }

  callback(null, true);
};
