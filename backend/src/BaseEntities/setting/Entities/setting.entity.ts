import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Setting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string;

  @Column()
  value: string;
}
