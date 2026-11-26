import { PartialType } from '@nestjs/mapped-types';
import { CreateManifestDto } from './create-manifest.dto';

export class UpdateManifestDto extends PartialType(CreateManifestDto) {
  id: number;
}
