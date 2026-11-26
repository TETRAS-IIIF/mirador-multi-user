import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { IsNumber, IsString } from 'class-validator';

/**
 * One row per canvas page of a project. Annotations live in the `annotation`
 * table; `content` is a copy of the page's published annotations, rewritten
 * after each change, so snapshots and older code keep working.
 */
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

  /**
   * False for pages written before annotations had their own rows: they are
   * split into rows at startup or on first access.
   */
  @Column({ default: false })
  migratedToRows: boolean;
}
