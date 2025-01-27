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
