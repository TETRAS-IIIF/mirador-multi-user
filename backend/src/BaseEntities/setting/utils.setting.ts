import * as process from 'node:process';

export const requiredSettings = {
  DISPLAY_USER_INSCRIPTION_PAGE: process.env.ALLOW_CREATE_USER,
  ALLOW_YOUTUBE_MEDIA: process.env.ALLOW_YOUTUBE_MEDIA,
  ALLOW_PEERTUBE_MEDIA: process.env.ALLOW_PEERTUBE_MEDIA,
  MAX_UPLOAD_SIZE: process.env.MAX_UPLOAD_SIZE,
};

export const unMutableSettings = new Map<string, string | undefined>([
  ['API_URL', process.env.BACKEND_URL],
  ['CADDY_URL', process.env.CADDY_URL],
  [
    'SWAGGER_URL',
    `${process.env.BACKEND_URL}/${process.env.SWAGGER_RELATIVE_PATH}`,
  ],
  ['BACKEND_LOG_LVL', process.env.LOG_LEVEL],
  ['INSTANCE_NAME', process.env.INSTANCE_NAME],
]);

export enum SettingKeys {
  DISPLAY_USER_INSCRIPTION_PAGE = 'DISPLAY_USER_INSCRIPTION_PAGE',
  ALLOW_YOUTUBE_MEDIA = 'ALLOW_YOUTUBE_MEDIA',
  ALLOW_PEERTUBE_MEDIA = 'ALLOW_PEERTUBE_MEDIA',
  MAX_UPLOAD_SIZE = 'MAX_UPLOAD_SIZE',
  API_URL = 'API_URL',
  CADDY_URL = 'CADDY_URL',
  SWAGGER_URL = 'SWAGGER_URL',
  BACKEND_LOG_LVL = 'BACKEND_LOG_LVL',
  INSTANCE_NAME = 'INSTANCE_NAME',
}
