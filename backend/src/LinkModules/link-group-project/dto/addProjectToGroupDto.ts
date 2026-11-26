import { GroupProjectRights } from '../../../enum/rights';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddProjectToGroupDto {
  @IsNumber()
  @ApiProperty()
  projectId: number;
  @IsNumber()
  @ApiProperty()
  groupId: number;
  @IsOptional()
  @ApiProperty()
  @IsEnum(GroupProjectRights)
  rights?: GroupProjectRights;
}
