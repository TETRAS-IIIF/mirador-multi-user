import { OBJECT_TYPES } from '../../utils/types.ts';

export type Tag = {
  title: string;
  id: number;
  objectsTaggedId?: number[];
};

export type Tagging = {
  id: number;
  objectId: number;
  objectTypes: OBJECT_TYPES;
  tag: Tag;
  tagId: number;
};
