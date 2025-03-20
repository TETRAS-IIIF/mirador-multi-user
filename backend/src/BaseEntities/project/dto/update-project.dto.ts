import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';
import { IsNumber } from 'class-validator';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsNumber()
  id: number;

  lockedByUserId?: number;

  lockedAt?: Date;
}
