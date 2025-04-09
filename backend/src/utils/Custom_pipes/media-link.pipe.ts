import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { join } from 'path';
import * as fs from 'fs';
import { createWriteStream } from 'fs';
import * as sharp from 'sharp';
import fetch from 'node-fetch';
import { generateAlphanumericSHA1Hash } from '../hashGenerator';
import { mediaTypes } from '../../enum/mediaTypes';
import {
  getPeerTubeThumbnail,
  getPeerTubeVideoID,
  getYoutubeThumbnail,
  getYouTubeVideoID,
  isImage,
  isPeerTubeVideo,
  isVideo,
  isYouTubeVideo,
} from './utils';
import { SettingsService } from '../../BaseEntities/setting/setting.service';
import { SettingKeys } from '../../BaseEntities/setting/utils.setting';
import { CustomLogger } from '../Logger/CustomLogger.service';

@Injectable()
export class MediaLinkInterceptor implements NestInterceptor {
  private readonly logger = new CustomLogger();

  constructor(private readonly settingsService: SettingsService) {}

  async processImage(buffer: Buffer, uploadPath: string): Promise<void> {
    const processedFilePath = join(uploadPath, `thumbnail.webp`);
    const sharpBuffer = await sharp(buffer)
      .resize(200, 200)
      .webp({ effort: 3 })
      .toBuffer();

    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(processedFilePath);
      writeStream.write(sharpBuffer);
      writeStream.end();
      writeStream.on('finish', () => resolve(null));
      writeStream.on('error', reject);
    });
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const url = request.body.url;
    try {
      let thumbnailBuffer: Buffer | null = null;
      let videoId: string | null = null;

      switch (true) {
        case await isImage(url):
          const imageResponse = await fetch(url);
          if (!imageResponse.ok) throw new Error('Failed to fetch media');
          thumbnailBuffer = Buffer.from(await imageResponse.arrayBuffer());
          request.mediaTypes = mediaTypes.IMAGE;
          break;

        case await isVideo(url):
          request.mediaTypes = mediaTypes.VIDEO;
          break;

        case isYouTubeVideo(url):
          const isYoutubeLinkAllowed =
            (await this.settingsService.get(
              SettingKeys.ALLOW_YOUTUBE_MEDIA,
            )) === 'true';

          if (!isYoutubeLinkAllowed) {
            this.logger.error(
              'YouTube Link are not supported',
              'MediaLinkInterceptor | isYoutubeVideo === true',
            );
            throw new BadRequestException('Youtube_not_allowed_error');
          }
          videoId = getYouTubeVideoID(url);
          if (videoId) {
            thumbnailBuffer = await getYoutubeThumbnail(videoId);
          }
          request.mediaTypes = mediaTypes.VIDEO;
          break;

        case await isPeerTubeVideo(url):
          const isPeertubeVideoAllowed =
            (await this.settingsService.get(
              SettingKeys.ALLOW_PEERTUBE_MEDIA,
            )) === 'true';
          if (!isPeertubeVideoAllowed) {
            this.logger.error(
              'Peertube Link are not supported',
              'MediaLinkInterceptor | isPeertubeVideo === true',
            );
            throw new BadRequestException('Peertube_not_allowed_error');
          }
          videoId = getPeerTubeVideoID(url);
          if (videoId) {
            thumbnailBuffer = await getPeerTubeThumbnail(url, videoId);
          }
          request.mediaTypes = mediaTypes.VIDEO;
          break;

        default:
          request.mediaTypes = mediaTypes.OTHER;
      }
      if (thumbnailBuffer) {
        const hash = generateAlphanumericSHA1Hash(
          `${Date.now().toString()}${Math.random().toString(36)}`,
        );
        const uploadBasePath = './upload'; // TODO this path should be in a config file
        const uploadPath = join(uploadBasePath, hash);

        if (!fs.existsSync(uploadBasePath)) {
          fs.mkdirSync(uploadBasePath, { recursive: true });
        }
        fs.mkdirSync(uploadPath, { recursive: true });

        await this.processImage(thumbnailBuffer, uploadPath);
        request.generatedHash = hash;
        request.processedFilePath = join(uploadPath, `thumbnail.webp`);
      }

      return next.handle();
    } catch (error) {
      if (error instanceof HttpException) {
        this.logger.error(error.message, error.stack);
        throw error;
      }
      this.logger.error(
        `Error processing image: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error processing image: ${error.message}`,
      );
    }
  }
}
