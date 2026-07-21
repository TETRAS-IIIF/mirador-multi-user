import { Settings } from '../features/admin/types/type.ts';

export const isValidFileForUpload = (file: File) => {
  return !isVideoOrAudioFile(file);
};

export function isDataUrl(url: string | undefined): boolean {
  return typeof url === 'string' && url.trim().startsWith('data:');
}

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
  ANNOTATION: 'ANNOTATION',
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
  ALLOW_PEERTUBE_MEDIA = 'ALLOW_PEERTUBE_MEDIA',
  ALLOW_YOUTUBE_MEDIA = 'ALLOW_YOUTUBE_MEDIA',
  API_URL = 'API_URL',
  BACKEND_LOG_LVL = 'BACKEND_LOG_LVL',
  CADDY_URL = 'CADDY_URL',
  CLASSIC_AUTHENTICATION = 'CLASSIC_AUTHENTICATION',
  DB_SIZE = 'DB_SIZE',
  DISABLE_PROJECT_LOCK = 'DISABLE_PROJECT_LOCK',
  INSTANCE_NAME = 'INSTANCE_NAME',
  MAX_UPLOAD_SIZE = 'MAX_UPLOAD_SIZE',
  OPENID_CONNECTION = 'OPENID_CONNECTION',
  SWAGGER_URL = 'SWAGGER_URL',
  UPLOAD_FOLDER_SIZE = 'UPLOAD_FOLDER_SIZE',
}

export const OPEN_ID_CONNECT_URL = import.meta.env.VITE_OIDC_ISSUER;
export const OIDC_CLIENT_ID = import.meta.env.VITE_OIDC_CLIENT_ID;
export const OIDC_REDIRECT_URI = import.meta.env.VITE_OIDC_REDIRECT_URI;

export function isValidUrl(string: string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const caddyUrl = import.meta.env.VITE_CADDY_URL;
