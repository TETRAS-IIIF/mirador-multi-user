import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsNumber, IsString } from 'class-validator';
import { Project } from '../../project/entities/project.entity';

@Entity()
export class Snapshot {
  @PrimaryGeneratedColumn()
  @IsNumber()
  id: number;

  @Column()
  @IsString()
  title: string;

  @Column()
  @IsString()
  hash: string;

  @Column()
  @IsNumber()
  creatorId: number;

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
  updated_at: Date;

  @ManyToOne(() => Project, (project) => project.snapshots, {
    onDelete: 'CASCADE',
  })
  project: Project;
}
