import { Project } from '../../../BaseEntities/project/entities/project.entity';
import { GroupProjectRights } from '../../../enum/rights';
import { UserGroup } from '../../../BaseEntities/user-group/entities/user-group.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProjectGroupDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  project: Project;
  @ApiProperty()
  rights?: GroupProjectRights;
  @ApiProperty()
  group?: UserGroup;
  @ApiProperty()
  noteTemplate?: any;
  @ApiProperty()
  tags?: string[];
}
