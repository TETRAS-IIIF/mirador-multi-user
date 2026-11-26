import { User_UserGroupRights } from '../../../enum/rights';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLinkUserGroupDto {
  @IsOptional()
  @IsEnum(User_UserGroupRights)
  rights?: User_UserGroupRights;

  @IsNotEmpty()
  userId: number;

  @IsNotEmpty()
  user_groupId: number;
}
