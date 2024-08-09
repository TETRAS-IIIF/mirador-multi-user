import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsEnum, IsNumberString, IsString } from 'class-validator';
import { LinkGroupProject } from '../../link-group-project/entities/link-group-project.entity';
import { LinkMediaGroup } from '../../link-media-group/entities/link-media-group.entity';
import { UserGroupTypes } from '../../enum/user-group-types';
import { LinkUserGroup } from '../../link-user-group/entities/link-user-group.entity';

@Entity()
export class UserGroup {
  @PrimaryGeneratedColumn()
  @IsNumberString()
  id: number;

  @Column({ length: 100 })
  @IsString()
  name: string;

  @Column()
  @IsNumberString()
  ownerId: number;

  @Column({ type: 'enum', enum: UserGroupTypes })
  @IsEnum(UserGroupTypes)
  type: UserGroupTypes;

  @OneToMany(() => LinkGroupProject, (linkGroup) => linkGroup.user_group, {})
  linkGroupProjects: LinkGroupProject[];

  @OneToMany(
    () => LinkMediaGroup,
    (linkMediaGroup) => linkMediaGroup.user_group,
  )
  linkMediaGroup: LinkMediaGroup;

  @OneToMany(() => LinkUserGroup, (linkUserGroup) => linkUserGroup.user_group)
  linkUserGroups: LinkUserGroup[];
}
