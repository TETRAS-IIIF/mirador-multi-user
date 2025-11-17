import { UserGroup } from '../../user-group/types/types.ts';
import { Dayjs } from 'dayjs';
import { ITEM_RIGHTS, OBJECT_ORIGIN } from '../../../utils/mmu_types.ts';

export type Manifest = {
  created_at: Dayjs;
  description: string;
  hash: string;
  id: number;
  idCreator: number;
  json?: any;
  title: string;
  origin: OBJECT_ORIGIN;
  path: string;
  updated_at: Dayjs;
  thumbnailUrl?: string;
  metadata: Record<string, string>;
  rights?: ITEM_RIGHTS;
  url: string;
  share?: string;
  shared?: boolean;
  personalOwnerGroupId?: number;
};

export type updateManifestJsonDto = {
  manifestId: number;
  json: any;
  origin: OBJECT_ORIGIN;
  path: string;
  hash: string;
};

export type grantAccessToManifestDto = {
  userGroupId: number;
  manifestId: number;
};

export type manifestCreationDto = {
  idCreator: number;
  manifestMedias: ManifestCanvases[];
  title: string;
  manifestThumbnail: string;
};
export type MediaItem = {
  title: string;
  value: string;
};

export type ManifestCanvases = {
  media: MediaItem[];
};

export type UploadAndLinkManifestDto = {
  title?: string;
  url?: string;
  idCreator: number;
  user_group?: UserGroup;
  file?: File;
  path?: string;
  rights?: ITEM_RIGHTS;
};

// TODO removed useless
export type ManifestItem = {
  id: string;
  type: string;
  height: number;
  width: number;
  label: { en: string[] };
  items: any[];
};

export type ManifestSubItem = {
  id: string;
  type: string;
  motivation: string;
  target: string;
  body: {
    id: string;
    type: string;
    format: string;
    height: number;
    width: number;
  };
};
