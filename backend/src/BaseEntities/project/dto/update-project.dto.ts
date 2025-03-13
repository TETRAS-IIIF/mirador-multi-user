import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsNumber()
  id: number;

  @IsOptional()
  snapShotHash?: string[];

  lockedByUserId?: number;

  lockedAt?: Date;
}
