import { Settings } from '../features/admin/types/type.ts';

export const isValidFileForUpload = (file: File) => {
  return !isVideoOrAudioFile(file);
};

const isVideoOrAudioFile = (file: File) => {
  return file.type.startsWith('video/') || file.type.startsWith('audio/');
};
const maxUploadSize =
  parseInt(import.meta.env.VITE_MAX_UPLOAD_SIZE, 10) * 1024 * 1024;

export const isFileSizeOverLimit = (file: File) => {
  return file.size >= maxUploadSize;
};

export const MENU_ELEMENT = {
  PROJECTS: 'PROJECT',
  GROUPS: 'GROUPS',
  MEDIA: 'MEDIA',
  MANIFEST: 'MANIFEST',
  SETTING: 'SETTING',
  ADMIN: 'ADMIN',
};

export const getSettingValue = (key: string, settings: Settings | undefined) => {
  if (!settings) return undefined;

  return (
    settings.mutableSettings.find((s) => s.key === key)?.value ??
    settings.unMutableSettings.find(([k]) => k === key)?.[1]
  );
};
