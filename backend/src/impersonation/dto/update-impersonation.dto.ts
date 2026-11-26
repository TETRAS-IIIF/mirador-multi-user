import { PartialType } from '@nestjs/swagger';
import { CreateImpersonationDto } from './create-impersonation.dto';

export class UpdateImpersonationDto extends PartialType(
  CreateImpersonationDto,
) {}
