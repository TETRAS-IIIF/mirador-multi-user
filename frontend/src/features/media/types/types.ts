import { UserGroup } from '../../user-group/types/types.ts';
import { Dayjs } from 'dayjs';
import {
  MEDIA_GROUP_RIGHTS,
  MEDIA_TYPES,
  OBJECT_ORIGIN,
} from '../../../utils/types.ts';

export type CreateMediaDto = {
  idCreator: number;
  user_group: UserGroup;
  file: File;
};

export type LinkMediaDto = {
  idCreator: number;
  user_group: UserGroup;
  url: string;
};

export type Media = {
  created_at: Dayjs;
  description: string;
  hash: string;
  id: number;
  idCreator: number;
  title: string;
  origin: OBJECT_ORIGIN;
  path?: string;
  rights: MEDIA_GROUP_RIGHTS;
  updated_at: Dayjs;
  url: string;
  metadata: Record<string, string>;
  mediaTypes: MEDIA_TYPES;
  share?: string;
  shared?: boolean;
  thumbnailUrl?: string;
};

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
