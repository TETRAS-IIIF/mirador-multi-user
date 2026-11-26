import { PartialType } from '@nestjs/swagger';
import { CreateAnnotationPageDto } from './create-annotation-page.dto';

export class UpdateAnnotationPageDto extends PartialType(
  CreateAnnotationPageDto,
) {}
