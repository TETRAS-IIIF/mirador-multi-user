import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { IsNumber, IsString } from 'class-validator';

@Entity()
@Unique(['annotationPageId', 'projectId'])
export class AnnotationPage {
  @PrimaryGeneratedColumn()
  id: number;

  @IsNumber()
  @Column()
  projectId: number;

  @Column()
  @IsString()
  annotationPageId: string;

  @Column({ type: 'json' })
  content: any;
}
