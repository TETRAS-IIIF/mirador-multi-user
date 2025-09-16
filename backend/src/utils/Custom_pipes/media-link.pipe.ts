import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
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
    const url: string = request.body.url;

    try {
      let thumbnailBuffer: Buffer | null = null;

      if (await isImage(url)) {
        thumbnailBuffer = await this.fetchBuffer(url);
        request.mediaTypes = mediaTypes.IMAGE;
      } else if (await isVideo(url)) {
        request.mediaTypes = mediaTypes.VIDEO;
      } else if (isYouTubeVideo(url)) {
        request.mediaTypes = mediaTypes.VIDEO;
        thumbnailBuffer = await this.handleYouTube(url);
      } else if (await isPeerTubeVideo(url)) {
        request.mediaTypes = mediaTypes.VIDEO;
        thumbnailBuffer = await this.handlePeerTube(url);
      } else {
        request.mediaTypes = mediaTypes.OTHER;
      }

      if (thumbnailBuffer) {
        await this.attachProcessedThumbnailToRequest(request, thumbnailBuffer);
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
      throw new BadRequestException(`Error processing image: ${error.message}`);
    }
  }
  D;
  private async fetchBuffer(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch media');
    return Buffer.from(await res.arrayBuffer());
  }

  private async handleYouTube(url: string): Promise<Buffer | null> {
    const allowed =
      (await this.settingsService.get(SettingKeys.ALLOW_YOUTUBE_MEDIA)) ===
      'true';
    if (!allowed) {
      this.logger.error(
        'YouTube Link are not supported',
        'MediaLinkInterceptor | isYoutubeVideo === true',
      );
      throw new BadRequestException('Youtube_not_allowed_error');
    }

    const videoId = getYouTubeVideoID(url);
    return videoId ? await getYoutubeThumbnail(videoId) : null;
  }

  private async handlePeerTube(url: string): Promise<Buffer | null> {
    const allowed =
      (await this.settingsService.get(SettingKeys.ALLOW_PEERTUBE_MEDIA)) ===
      'true';
    if (!allowed) {
      this.logger.error(
        'Peertube Link are not supported',
        'MediaLinkInterceptor | isPeertubeVideo === true',
      );
      throw new BadRequestException('Peertube_not_allowed_error');
    }

    const videoId = getPeerTubeVideoID(url);
    return videoId ? await getPeerTubeThumbnail(url, videoId) : null;
  }

  private async attachProcessedThumbnailToRequest(
    request: any,
    thumbnailBuffer: Buffer,
  ): Promise<void> {
    const hash = generateAlphanumericSHA1Hash(
      `${Date.now().toString()}${Math.random().toString(36)}`,
    );

    const uploadBasePath = './upload';
    const uploadPath = join(uploadBasePath, hash);

    if (!fs.existsSync(uploadBasePath)) {
      fs.mkdirSync(uploadBasePath, { recursive: true });
    }
    fs.mkdirSync(uploadPath, { recursive: true });

    await this.processImage(thumbnailBuffer, uploadPath);

    request.generatedHash = hash;
    request.processedFilePath = join(uploadPath, 'thumbnail.webp');
  }
}
