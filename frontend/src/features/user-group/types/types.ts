import { ITEM_RIGHTS, USER_GROUP_TYPES } from '../../../utils/mmu_types.ts';
import { User } from '../../auth/types/types.ts';
import { Dayjs } from 'dayjs';

export type LinkUserGroup = {
  id: number;
  rights: ITEM_RIGHTS;
  user: User;
  user_group: UserGroup;
  personalOwnerGroupId?: number;
};

export type UserGroup = {
  id: number;
  title: string;
  ownerId: number;
  description: string;
  type: USER_GROUP_TYPES;
  rights?: ITEM_RIGHTS;
  thumbnailUrl?: string;
  created_at: Dayjs;
  shared?: boolean;
  updated_at: Dayjs;
};

export type CreateGroupDto = {
  title: string;
  ownerId: number;
  user: User;
};

export type AddProjectToGroupDto = {
  projectId: number;
  groupId: number;
};

export type RemoveProjectToGroupDto = {
  projectId: number;
  groupId: number;
};

export type changeAccessToGroupDto = {
  userId: number;
  groupId: number;
  rights: ITEM_RIGHTS;
};
