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

export const PROJECT_RIGHTS_PRIORITY = { Admin: 3, Editor: 2, Reader: 1 };
