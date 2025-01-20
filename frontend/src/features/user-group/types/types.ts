import { User } from '../../auth/types/types.ts';
import { Dayjs } from 'dayjs';

export enum UserGroupTypes {
  PERSONAL = 'personal',
  MULTI_USER = 'multi-user',
}

export enum ItemsRights {
  ADMIN = 'admin',
  READER = 'reader',
  EDITOR = 'editor',
}


export type LinkUserGroup = {
  id: number,
  rights: ItemsRights,
  user: User,
  user_group: UserGroup
}

export type UserGroup = {
  id: number;
  title: string;
  ownerId: number;
  description: string;
  type: UserGroupTypes;
  rights?: ItemsRights;
  thumbnailUrl?: string;
  created_at: Dayjs;
}

export type CreateGroupDto = {
  title: string;
  ownerId: number;
  user: User;
}

export type AddProjectToGroupDto = {
  projectId: number;
  groupId: number;
}

export type RemoveProjectToGroupDto = {
  projectId: number;
  groupId: number;
}

export type changeAccessToGroupDto = {
  userId: number;
  groupId: number;
  rights: ItemsRights;
}
