import IState from "../../mirador/interface/IState.ts";
import { User } from "../../auth/types/types.ts";
import { ItemsRights, UserGroup } from "../../user-group/types/types.ts";
import { Dayjs } from "dayjs";

export type Project = {
  id: number;
  title: string;
  userWorkspace: IState;
  owner: User;
  rights?: ItemsRights;
  description: string;
  thumbnailUrl?: string;
  metadata: Record<string, string>;
  created_at: Dayjs;
  lockedByUserId: number;
  lockedAt: Date;
  share?: string;
  noteTemplate?: Template[];
  tags?: string[];
  snapShots: Snapshot[];
};

export type Template = {
  title: string;
  content: string;
};
export type ProjectGroup = {
  id: number;
  rights: ItemsRights;
  user_group: UserGroup;
};
export type ProjectUser = {
  id: number;
  rights: ItemsRights;
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
  rights?: ItemsRights;
  group?: UserGroup;
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
  align?: "left" | "right" | "center";
};

export type RowProps = {
  id: number;
  itemId?: number;
  data: RowData[];
  snapShotHash?: string;
  generatedAt?: Date;
  title?: string;
};

export type Snapshot = {
  id: number;
  title: string;
  hash: string;
  creatorId: number;
  createdAt: Date;
  updatedAt: Date;
  project: Project;
};
