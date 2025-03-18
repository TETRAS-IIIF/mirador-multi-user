import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsEnum, IsNumberString, IsString } from 'class-validator';
import { LinkGroupProject } from '../../../LinkModules/link-group-project/entities/link-group-project.entity';
import { LinkMediaGroup } from '../../../LinkModules/link-media-group/entities/link-media-group.entity';
import { UserGroupTypes } from '../../../enum/user-group-types';
import { LinkUserGroup } from '../../../LinkModules/link-user-group/entities/link-user-group.entity';
import { LinkManifestGroup } from '../../../LinkModules/link-manifest-group/entities/link-manifest-group.entity';
import { Tag } from '../../tag/entities/tag.entity';
import { LinkMetadataFormatGroup } from '../../../LinkModules/link-metadata-format-group/entities/link-metadata-format-group.entity';

@Entity()
export class UserGroup {
  @PrimaryGeneratedColumn()
  @IsNumberString()
  id: number;

  @Column()
  @IsString()
  title: string;

  @Column()
  @IsNumberString()
  ownerId: number;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ nullable: true })
  description: string;

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

  @OneToMany(
    () => LinkManifestGroup,
    (linkManifestGroup) => linkManifestGroup.user_group,
  )
  linkManifestGroup: LinkManifestGroup[];

  @OneToMany(
    () => LinkMetadataFormatGroup,
    (linkMetadataFormatGroup) => linkMetadataFormatGroup.user_group,
  )
  linkMetadataFormatGroup: LinkMetadataFormatGroup[];

  @ManyToOne(() => Tag)
  @JoinColumn({ name: 'tagId' })
  tag: Tag;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  public updated_at: Date;
}
