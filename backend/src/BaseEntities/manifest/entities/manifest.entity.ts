import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsNumberString, IsString } from 'class-validator';
import { LinkManifestGroup } from '../../../LinkModules/link-manifest-group/entities/link-manifest-group.entity';
import { manifestOrigin } from '../../../enum/origins';

@Entity()
export class Manifest {
  @PrimaryGeneratedColumn()
  id: number;

  @IsString()
  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'enum', enum: manifestOrigin })
  origin: manifestOrigin;

  @IsString()
  @Column({ nullable: true })
  path: string;

  @IsString()
  @Column({ nullable: true })
  hash: string;

  @IsString()
  @Column()
  title: string;

  @IsString()
  @Column()
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @IsNumberString()
  @Column()
  idCreator: number;

  @IsString()
  @Column({ nullable: true })
  url: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  public created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  public updated_at: Date;

  @OneToMany(
    () => LinkManifestGroup,
    (linkManifestGroup) => linkManifestGroup.manifest,
  )
  linkManifestGroup: LinkManifestGroup;
}
