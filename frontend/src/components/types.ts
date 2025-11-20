import { ITEM_RIGHTS, USER_GROUP_TYPES } from '../utils/mmu_types.ts';
import { User } from '../features/auth/types/types.ts';

export type ListItem = {
  id: number;
  title?: string;
  rights?: ITEM_RIGHTS;
  type?: USER_GROUP_TYPES;
  personalOwnerGroupId?: number;
};

export type ItemOwner = {
  rights: ITEM_RIGHTS;
};
export type ModalEditItem = {
  id: number;
  name: string;
  users?: User[];
};
