import { UserGroup } from '../../user-group/types/types.ts';
import { Dayjs } from 'dayjs';

export type CreateMediaDto = {
  idCreator: number
  user_group: UserGroup;
  file: File;
}

export type LinkMediaDto = {
  idCreator: number
  user_group: UserGroup;
  url: string
}

export enum mediaOrigin {
  UPLOAD = 'upload',
  LINK = 'link',
}

export type Media = {
  created_at: Dayjs,
  description: string,
  hash: string
  id: number
  idCreator: number,
  title: string,
  origin: mediaOrigin
  path?: string,
  rights: MediaGroupRights
  updated_at: Dayjs,
  url: string,
  metadata: Record<string, string>;
  mediaTypes: MediaTypes;
}

export enum MediaGroupRights {
  ADMIN = 'admin',
  READER = 'reader',
  EDITOR = 'editor',
}

export enum MediaTypes {
  VIDEO = 'video',
  IMAGE = 'image',
  AUDIO = 'audio',
}

export type YoutubeVideoJson = {
  title: string;
  author_name: string;
  author_url: string;
  type: 'video';
  height: number;
  width: number;
  version: string;
  provider_name: string;
  provider_url: string;
  thumbnail_height: number;
  thumbnail_width: number;
  thumbnail_url: string;
  html: string;
};
