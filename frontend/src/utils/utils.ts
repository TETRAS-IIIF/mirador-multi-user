import { Settings } from '../features/admin/types/type.ts';

export const isValidFileForUpload = (file: File) => {
  return !isVideoOrAudioFile(file);
};

const isVideoOrAudioFile = (file: File) => {
  return file.type.startsWith('video/') || file.type.startsWith('audio/');
};

export const isFileSizeOverLimit = (file: File, MAX_UPLOAD_SIZE: number) => {
  return file.size >= MAX_UPLOAD_SIZE;
};

export const MENU_ELEMENT = {
  PROJECTS: 'PROJECT',
  GROUPS: 'GROUPS',
  MEDIA: 'MEDIA',
  MANIFEST: 'MANIFEST',
  SETTING: 'SETTING',
  ADMIN: 'ADMIN',
};

export const getSettingValue = (key: SettingKeys, settings: Settings | undefined) => {
  if (!settings) return undefined;

  return (
    settings.mutableSettings.find((s) => s.key === key)?.value ??
    settings.unMutableSettings.find(([k]) => k === key)?.[1]
  );
};


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
