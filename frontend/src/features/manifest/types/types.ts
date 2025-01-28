import { UserGroup } from "../../user-group/types/types.ts";
import { Dayjs } from "dayjs";

export type Manifest = {
  created_at: Dayjs;
  description: string;
  hash: string;
  id: number;
  idCreator: number;
  json?: any;
  title: string;
  origin: manifestOrigin;
  path: string;
  updated_at: Date;
  thumbnailUrl?: string;
  metadata: Record<string, string>;
  rights?: ManifestGroupRights;
  url: string;
  share: string;
};

export type updateManifestJsonDto = {
  manifestId: number;
  json: any;
  origin: manifestOrigin;
  path: string;
  hash: string;
};

export type grantAccessToManifestDto = {
  userGroupId: number;
  manifestId: number;
};

export enum ManifestGroupRights {
  ADMIN = "admin",
  READER = "reader",
  EDITOR = "editor",
}

export enum manifestOrigin {
  UPLOAD = "upload",
  LINK = "link",
  CREATE = "create",
}

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
  rights?: ManifestGroupRights;
};

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
