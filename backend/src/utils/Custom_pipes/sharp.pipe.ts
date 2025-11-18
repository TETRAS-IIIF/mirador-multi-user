import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import * as sharp from 'sharp';
import { Observable } from 'rxjs';
import * as fs from 'fs';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { generateAlphanumericSHA1Hash } from '../hashGenerator';
import { THUMBNAIL_FILE_SUFFIX, UPLOAD_FOLDER } from '../constants';
import { isImage } from '../checkTypes/isImage';
import { mediaTypes } from '../../enum/mediaTypes';
import { isHtmlFile, postTreatmentOfHtmlFile } from './htmlFileTreatment';

@Injectable()
export class SharpPipeInterceptor implements NestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const file = request.file;
    const isThisAnImage = isImage(request.file);
    if (isThisAnImage) {
      if (file) {
        request.fileType = mediaTypes.IMAGE;
        const filePath = file.path;
        return sharp(filePath)
          .resize(200, 200)
          .webp({ effort: 3 })
          .toBuffer()
          .then((buffer) => {
            const processedFilePath = `${file.destination}/thumbnail.webp`;
            return sharp(buffer).toFile(processedFilePath);
          })
          .then(() => next.handle());
      }
      // Handle base64-encoded file in request.body
      else if (request.body.file) {
        const base64File = request.body.file;
        const matches = base64File.match(/^data:(.+);base64,(.+)$/);

        if (!matches) {
          throw new Error('Invalid file format');
        }

        const mimeType = matches[1];
        const fileExtension = mimeType.split('/')[1];
        const fileBuffer = Buffer.from(matches[2], 'base64');

        const hash = generateAlphanumericSHA1Hash(
          `${Date.now().toString()}${Math.random().toString(36)}`,
        );
        const uploadPath = `${UPLOAD_FOLDER}/${hash}`;

        fs.mkdirSync(uploadPath, { recursive: true });

        const fileName =
          request.body.fileName || `uploaded_file.${fileExtension}`;
        const processedFilePath = join(
          uploadPath,
          `${fileName}${THUMBNAIL_FILE_SUFFIX}`,
        );
        request.generatedHash = hash;
        return sharp(fileBuffer)
          .resize(200, 200)
          .webp({ effort: 3 })
          .toBuffer()
          .then((buffer) => {
            return new Promise((resolve, reject) => {
              const writeStream = createWriteStream(processedFilePath);
              writeStream.write(buffer);
              writeStream.end();
              writeStream.on('finish', () => {
                request.processedFilePath = processedFilePath;
                resolve(next.handle());
              });
              writeStream.on('error', reject);
            });
          });
      }
    } else {
      request.fileType = mediaTypes.OTHER;
    }

    if (file && isHtmlFile(file)) {
      const filepath = file?.path;
      const htmlContent = fs.readFileSync(filepath, 'utf-8');
      const updatedContent = postTreatmentOfHtmlFile(htmlContent);

      fs.writeFileSync(filepath, updatedContent, 'utf-8');
    }
    return next.handle();
  }
}
