import { UnsupportedMediaTypeException } from '@nestjs/common';

export const fileFilterMedia = (req, file, callback) => {
  // TODO the check must be done on the MIME type. Here on file.mimetype field

  console.log(parseInt(process.env.MAX_UPLOAD_SIZE, 10));
  if (
    !file.originalname.match(
      /\.(jpg|jpeg|png|webp|gif|bmp|tiff|svg|ico|jfif|heic|heif)$/i,
    )
  ) {
    return callback(
      new UnsupportedMediaTypeException('Only image files are allowed!'),
      false,
    );
  }
  callback(null, true);
};
