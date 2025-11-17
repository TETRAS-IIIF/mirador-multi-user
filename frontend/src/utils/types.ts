export enum MEDIA_TYPES {
  VIDEO = 'video',
  IMAGE = 'image',
  AUDIO = 'audio',
  OTHER = 'other',
}

export enum OBJECT_TYPES {
  MEDIA = 'media',
  MANIFEST = 'manifest',
  GROUP = 'group',
  PROJECT = 'project',
}

export enum MANIFEST_GROUP_RIGHTS {
  ADMIN = 'admin',
  READER = 'reader',
  EDITOR = 'editor',
}

export enum MANIFEST_ORIGIN {
  UPLOAD = 'upload',
  LINK = 'link',
  CREATE = 'create',
}

export enum USER_GROUP_TYPES {
  PERSONAL = 'personal',
  MULTI_USER = 'multi-user',
}

export enum ITEM_RIGHTS {
  ADMIN = 'admin',
  READER = 'reader',
  EDITOR = 'editor',
}

export enum MEDIA_ORIGIN {
  UPLOAD = 'upload',
  LINK = 'link',
}

export enum MEDIA_GROUP_RIGHTS {
  ADMIN = 'admin',
  READER = 'reader',
  EDITOR = 'editor',
}

export const MEDIA_TYPES_TABS = {
  ALL: 0,
  VIDEO: 1,
  IMAGE: 2,
  OTHER: 3,
};
