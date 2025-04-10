export enum MediaGroupRights {
  ADMIN = 'admin',
  READER = 'reader',
  EDITOR = 'editor',
}

export enum GroupProjectRights {
  ADMIN = 'admin',
  READER = 'reader',
  EDITOR = 'editor',
}

export enum User_UserGroupRights {
  ADMIN = 'admin',
  READER = 'reader',
  EDITOR = 'editor',
}

export enum ManifestGroupRights {
  ADMIN = 'admin',
  READER = 'reader',
  EDITOR = 'editor',
}

export const ITEM_RIGHTS_PRIORITY = { admin: 3, editor: 2, reader: 1 };
