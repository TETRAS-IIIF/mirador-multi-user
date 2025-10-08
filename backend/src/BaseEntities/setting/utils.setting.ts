import * as process from 'node:process';

export const requiredSettings = {
  ALLOW_NEW_USER: process.env.ALLOW_CREATE_USER
    ? process.env.ALLOW_CREATE_USER
    : true,
  ALLOW_YOUTUBE_MEDIA: process.env.ALLOW_YOUTUBE_MEDIA,
  ALLOW_PEERTUBE_MEDIA: process.env.ALLOW_PEERTUBE_MEDIA,
  MAX_UPLOAD_SIZE: process.env.MAX_UPLOAD_SIZE,
  OPENID_CONNECTION: process.env.OPENID_CONNECTION,
  CLASSIC_AUTHENTICATION: process.env.CLASSIC_AUTHENTICATION
    ? process.env.CLASSIC_AUTHENTICATION
    : true,
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
  ALLOW_NEW_USER = 'ALLOW_NEW_USER',
  ALLOW_YOUTUBE_MEDIA = 'ALLOW_YOUTUBE_MEDIA',
  ALLOW_PEERTUBE_MEDIA = 'ALLOW_PEERTUBE_MEDIA',
  MAX_UPLOAD_SIZE = 'MAX_UPLOAD_SIZE',
  OPENID_CONNECTION = 'OPENID_CONNECTION',
  CLASSIC_AUTHENTICATION = 'CLASSIC_AUTHENTICATION',
  API_URL = 'API_URL',
  CADDY_URL = 'CADDY_URL',
  SWAGGER_URL = 'SWAGGER_URL',
  BACKEND_LOG_LVL = 'BACKEND_LOG_LVL',
  INSTANCE_NAME = 'INSTANCE_NAME',
}

export const parseHumanSizeToMB = (humanSize: string): number => {
  const size = parseFloat(humanSize);
  const unit = humanSize.replace(/[0-9.]/g, '').toUpperCase();

  switch (unit) {
    case 'K':
      return size / 1024;
    case 'M':
      return size;
    case 'G':
      return size * 1024;
    case 'T':
      return size * 1024 * 1024;
    default:
      return size;
  }
};
