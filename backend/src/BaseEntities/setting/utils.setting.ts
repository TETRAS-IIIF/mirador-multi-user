import * as process from 'node:process';

export const requiredSettings = {
  DISPLAY_USER_INSCRIPTION_PAGE: process.env.ALLOW_CREATE_USER,
  ALLOW_YOUTUBE_MEDIA: process.env.ALLOW_YOUTUBE_MEDIA,
  ALLOW_PEERTUBE_MEDIA: process.env.ALLOW_PEERTUBE_MEDIA,
  MAX_UPLOAD_SIZE: process.env.MAX_UPLOAD_SIZE,
};

export const unMutableSettings = [
  ['API_URL', process.env.BACKEND_URL],
  ['CADDY_URL', process.env.CADDY_URL],
  [
    'SWAGGER_URL',
    process.env.BACKEND_URL + '/' + process.env.SWAGGER_RELATIVE_PATH,
  ],
  ['BACKEND_LOG_LVL', process.env.LOG_LEVEL],
  ['INSTANCE_NAME', process.env.INSTANCE_NAME],
];
