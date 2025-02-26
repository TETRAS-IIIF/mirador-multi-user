import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsNumberString, IsString } from 'class-validator';
import { LinkGroupProject } from '../../../LinkModules/link-group-project/entities/link-group-project.entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  @IsNumberString()
  id: number;

  @Column({ length: 100 })
  @IsString()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column()
  ownerId: number;

  @Column({ type: 'json', nullable: true })
  userWorkspace?: any;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({ nullable: true })
  snapShotHash: string;

  @Column({ nullable: true })
  lockedByUserId: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedAt: Date;

  @Column({ type: 'json', nullable: true })
  noteTemplate: string[];

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  created_at: Date;

  @OneToMany(
    () => LinkGroupProject,
    (linkGroupProject) => linkGroupProject.project,
    {
      onDelete: 'CASCADE',
    },
  )
  linkGroupProjectsIds: LinkGroupProject[];
}
