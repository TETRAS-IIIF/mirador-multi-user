import IState from '../../mirador/interface/IState.ts';
import { User } from '../../auth/types/types.ts';
import { UserGroup } from '../../user-group/types/types.ts';
import { Dayjs } from 'dayjs';
import { ITEM_RIGHTS } from '../../../utils/types.ts';

export type Project = {
  created_at: Dayjs;
  description: string;
  id: number;
  lockedAt: Date;
  lockedByUserId: number;
  metadata: Record<string, string>;
  noteTemplate?: Template[];
  owner: User;
  rights?: ITEM_RIGHTS;
  share?: string;
  shared: boolean;
  snapShots: Snapshot[];
  tags?: string[];
  thumbnailUrl?: string;
  title: string;
  updated_at: Dayjs;
  userWorkspace: IState;
};

export type Template = {
  id: string;
  title: string;
  content: string;
};
export type ProjectGroup = {
  personalOwnerGroupId?: number;
  id: number;
  rights: ITEM_RIGHTS;
  user_group: UserGroup;
};
export type ProjectUser = {
  id: number;
  rights: ITEM_RIGHTS;
  project: Project;
};

export type ProjectGroupUpdateDto = {
  id?: number;
  project: {
    id: number;
    title: string;
    userWorkspace: IState;
    ownerId?: number;
    noteTemplate?: Template[];
    tags?: string[];
  };
  rights?: ITEM_RIGHTS;
  group?: UserGroup;
  shared?: boolean;
};
export type CreateProjectDto = {
  title: string;
  ownerId: number;
  userWorkspace: IState | undefined;
  metadata: Record<string, string>;
};

export type LockProjectDto = {
  projectId: number;
  lock: boolean;
};

export type RowData = {
  value: string;
  align?: 'left' | 'right' | 'center';
};

export type RowProps = {
  id: number;
  itemId?: number;
  data: RowData[];
  snapShotHash?: string;
  generatedAt?: Date;
  title?: string;
  snapshotId?: number;
};

export type Snapshot = {
  id: number;
  title: string;
  hash: string;
  creator: string;
  createdAt: Date;
  updated_at: Date;
  project: Project;
};
