import { PartialType } from '@nestjs/mapped-types';
import { User_UserGroupRights } from '../../../enum/rights';
import { CreateUserGroupDto } from '../../../BaseEntities/user-group/dto/create-user-group.dto';

export class UpdateUserGroupDto extends PartialType(CreateUserGroupDto) {
  ownerId: number;
  id: number;
  rights: User_UserGroupRights;
}
