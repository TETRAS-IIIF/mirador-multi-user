import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { LinkMetadataFormatGroup } from '../../../LinkModules/link-metadata-format-group/entities/link-metadata-format-group.entity';
import { Metadata } from '../../metadata/entities/metadata.entity';

@Entity()
@Unique(['creatorId', 'title'])
export class MetadataFormat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  creatorId: number;

  @Column({ type: 'json' })
  metadata: any;

  @OneToMany(
    () => LinkMetadataFormatGroup,
    (LinkMetadataFormatGroup) => LinkMetadataFormatGroup.metadataFormat,
    {
      onDelete: 'CASCADE',
    },
  )
  linkMetadataFormatGroups: LinkMetadataFormatGroup[];

  @OneToMany(() => Metadata, (metadata) => metadata.metadataFormat)
  metadataImplementations: Metadata[];
}
