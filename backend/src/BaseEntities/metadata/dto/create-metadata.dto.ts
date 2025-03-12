import { ObjectTypes } from '../../../enum/ObjectTypes';

export class CreateMetadataDto {
  objectTypes: ObjectTypes;
  objectId: number;
  metadataFormatTitle: string;
  metadata: any;
  ownerId: number
}
