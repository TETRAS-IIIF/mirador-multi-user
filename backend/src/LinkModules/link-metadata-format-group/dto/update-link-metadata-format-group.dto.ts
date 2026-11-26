import { PartialType } from '@nestjs/swagger';
import { CreateLinkMetadataFormatGroupDto } from './create-link-metadata-format-group.dto';

export class UpdateLinkMetadataFormatGroupDto extends PartialType(
  CreateLinkMetadataFormatGroupDto,
) {}
