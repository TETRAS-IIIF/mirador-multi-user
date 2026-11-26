import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupManifestDto } from './create-group-manifest.dto';

export class UpdateGroupManifestDto extends PartialType(
  CreateGroupManifestDto,
) {}
