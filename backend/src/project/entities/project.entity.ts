import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IsNumberString } from 'class-validator';
import { LinkGroupProject } from "../../link-group-project/entities/link-group-project.entity";
import { UserGroup } from "../../user-group/entities/user-group.entity";

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  @IsNumberString()
  id: number;

  @Column({ length: 100 })
  name: string;

  @ManyToOne(() => User, (user) => user.projects, {
    nullable: false,
    cascade: true,
    eager: true,
  })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'json' })
  userWorkspace: any;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  created_at: Date;

  @ManyToOne(() => LinkGroupProject, (linkGroup) => linkGroup.groups, {})
  linkGroupProjects: LinkGroupProject[];
}
