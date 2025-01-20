export type Tag = {
  title: string
  id: number
  objectsTaggedId?: number[]
}

export enum ObjectTypes {
  MEDIA = 'media',
  MANIFEST = 'manifest',
  GROUP = 'group',
  PROJECT = 'project',
}

export type Tagging = {
  id: number,
  objectId: number,
  objectTypes: ObjectTypes,
  tag: Tag,
  tagId: number,
}
