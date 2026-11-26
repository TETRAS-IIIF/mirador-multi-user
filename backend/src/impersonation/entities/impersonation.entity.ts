import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../BaseEntities/users/entities/user.entity';

@Entity('impersonations')
export class Impersonation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.impersonations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'admin_user_id' })
  adminUser: User;

  @Column({ type: 'varchar' })
  token: string;

  @Column({ type: 'datetime' })
  exchangeBefore: Date;

  @Column({ type: 'boolean', default: false })
  used: boolean;
}
