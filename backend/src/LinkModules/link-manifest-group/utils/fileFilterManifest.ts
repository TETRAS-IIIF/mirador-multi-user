import { BadRequestException } from '@nestjs/common';

export const fileFilterManifest = (req, file, callback) => {
  if (!file.originalname.match(/\.(json)$/)) {
    return callback(
      new BadRequestException('Only JSON files are allowed!'),
      false,
    );
  }
  callback(null, true);
};
