import { PartialType } from '@nestjs/swagger';
import { CreateMetadataFormatDto } from './create-metadata-format.dto';

export class UpdateMetadataFormatDto extends PartialType(
  CreateMetadataFormatDto,
) {}
