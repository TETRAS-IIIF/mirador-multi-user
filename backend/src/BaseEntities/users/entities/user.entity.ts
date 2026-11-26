import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LinkUserGroup } from '../../../LinkModules/link-user-group/entities/link-user-group.entity';
import { Impersonation } from '../../../impersonation/entities/impersonation.entity';
import { Language } from '../../../utils/email/utils';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ length: 300 })
  mail!: string;

  @Index({ unique: true })
  @Column({ length: 300 })
  name: string;

  @Index()
  @Column({ type: 'text', nullable: true })
  resetToken: string;

  @Index()
  @Column({ length: 300 })
  password: string;

  @Index()
  @Column({ type: 'timestamp', default: () => 'current_timestamp' })
  createdAt!: Date;

  @Index()
  @Column({ type: 'boolean', default: false })
  _isAdmin: boolean;

  @Column({ default: false })
  isEmailConfirmed: boolean;

  @OneToMany(() => LinkUserGroup, (linkUserGroup) => linkUserGroup.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  linkUserGroups: LinkUserGroup[];

  @OneToMany(() => Impersonation, (impersonation) => impersonation.user)
  impersonations: Impersonation[];

  @Index()
  @Column({ nullable: true, type: 'enum', enum: Language })
  preferredLanguage: Language;

  @Index()
  @Column({ nullable: true })
  lastConnectedAt: Date | null;

  @Column({ type: 'int', default: 0 })
  loginCounter: number;

  @Column({ nullable: true })
  termsValidatedAt: Date;
}
