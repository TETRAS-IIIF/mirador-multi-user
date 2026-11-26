import { GroupProjectRights } from '../../../enum/rights';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAccessToProjectDto {
  @ApiProperty()
  projectId: number;

  @ApiProperty()
  rights: GroupProjectRights;

  @ApiProperty()
  groupId: number;
}
