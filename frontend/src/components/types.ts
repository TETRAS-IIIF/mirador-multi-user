import {
  ItemsRights,
  UserGroupTypes,
} from "../features/user-group/types/types.ts";
import { User } from "../features/auth/types/types.ts";

export type ListItem = {
  id: number;
  title?: string;
  rights?: ItemsRights;
  type?: UserGroupTypes;
};

export type ItemOwner = {
  rights: ItemsRights;
};
export type ModalEditItem = {
  id: number;
  name: string;
  users?: User[];
};
