import { Settings } from '../features/admin/types/type.ts';

export const isValidFileForUpload = (file: File) => {
  return !isVideoOrAudioFile(file);
};

const isVideoOrAudioFile = (file: File) => {
  return file.type.startsWith('video/') || file.type.startsWith('audio/');
};

export const isFileSizeOverLimit = (file: File, MAX_UPLOAD_SIZE: number) => {
  const fileSizeMo = file.size / (1024 * 1024);
  return fileSizeMo >= MAX_UPLOAD_SIZE;
};

export const MENU_ELEMENT = {
  PROJECTS: 'PROJECT',
  GROUPS: 'GROUPS',
  MEDIA: 'MEDIA',
  MANIFEST: 'MANIFEST',
  SETTING: 'SETTING',
  ADMIN: 'ADMIN',
};

export const getSettingValue = (
  key: SettingKeys,
  settings: Settings | undefined,
) => {
  if (!settings) return undefined;

  return (
    settings.mutableSettings.find((s) => s.key === key)?.value ??
    settings.unMutableSettings.find(([k]) => k === key)?.[1]
  );
};

// Note : you need to update also constant in backend/src/auth/utils.ts
export const PASSWORD_MINIMUM_LENGTH = 8;

export enum SettingKeys {
  ALLOW_NEW_USER = 'ALLOW_NEW_USER',
  ALLOW_YOUTUBE_MEDIA = 'ALLOW_YOUTUBE_MEDIA',
  ALLOW_PEERTUBE_MEDIA = 'ALLOW_PEERTUBE_MEDIA',
  MAX_UPLOAD_SIZE = 'MAX_UPLOAD_SIZE',
  API_URL = 'API_URL',
  CADDY_URL = 'CADDY_URL',
  SWAGGER_URL = 'SWAGGER_URL',
  BACKEND_LOG_LVL = 'BACKEND_LOG_LVL',
  INSTANCE_NAME = 'INSTANCE_NAME',
  UPLOAD_FOLDER_SIZE = 'UPLOAD_FOLDER_SIZE',
  DB_SIZE = 'DB_SIZE',
  CLASSIC_AUTHENTICATION = 'CLASSIC_AUTHENTICATION',
  OPENID_CONNECTION = 'OPENID_CONNECTION',
}

export const OPEN_ID_CONNECT_URL = import.meta.env.VITE_OIDC_ISSUER;
export const OIDC_CLIENT_ID = import.meta.env.VITE_OIDC_CLIENT_ID;
export const OIDC_REDIRECT_URI = import.meta.env.VITE_OIDC_REDIRECT_URI;

export function isValidUrl(string: string) {
  const pattern =
    /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
  return pattern.test(string);
}
