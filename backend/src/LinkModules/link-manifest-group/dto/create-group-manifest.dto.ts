import { IsOptional } from 'class-validator';
import { UserGroup } from '../../../BaseEntities/user-group/entities/user-group.entity';
import { ManifestGroupRights } from '../../../enum/rights';
import { Manifest } from '../../../BaseEntities/manifest/entities/manifest.entity';

export class CreateGroupManifestDto {
  path: string;

  idCreator: number;

  title: string;
  @IsOptional()
  thumbnailUrl: string;

  rights: ManifestGroupRights;

  @IsOptional()
  manifest?: Manifest;
  @IsOptional()
  description: string;

  @IsOptional()
  user_group: UserGroup;
}
