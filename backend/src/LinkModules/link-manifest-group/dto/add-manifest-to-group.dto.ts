import { ManifestGroupRights } from '../../../enum/rights';
import { IsEnum, IsNumber, IsOptional } from "class-validator";

export class AddManifestToGroupDto {
  @IsNumber()
  userGroupId: number;
  @IsNumber()
  manifestId: number;
  @IsOptional()
  @IsEnum(ManifestGroupRights)
  rights?: ManifestGroupRights;
}
