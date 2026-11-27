import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { AnnotationBatch } from './annotation-batch.entity';

export enum AnnotationStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export enum AnnotationOrigin {
  HUMAN = 'human',
  AI = 'ai',
}

/**
 * One row per W3C annotation. `annotation_page.content` is rebuilt from these
 * rows (published only) after each change, so the page JSON stays available
 * to snapshots, exports and older code.
 */
@Entity()
@Unique(['projectId', 'annotationId'])
@Index(['projectId', 'annotationPageId'])
@Index(['projectId', 'status'])
export class Annotation {
  @PrimaryGeneratedColumn()
  id: number;

  /** IIIF/W3C id of the annotation (`content.id`). Unique within a project. */
  @Column({ length: 512 })
  annotationId: string;

  @Column()
  projectId: number;

  /** Id of the canvas annotation page, e.g. `<canvasId>/annotationPage`. */
  @Column({ length: 512 })
  annotationPageId: string;

  /** The W3C annotation, without `mmu:` fields. */
  @Column({ type: 'json' })
  content: any;

  @Column({
    type: 'enum',
    enum: AnnotationStatus,
    default: AnnotationStatus.PUBLISHED,
  })
  status: AnnotationStatus;

  @Column({
    type: 'enum',
    enum: AnnotationOrigin,
    default: AnnotationOrigin.HUMAN,
  })
  origin: AnnotationOrigin;

  @Column({ nullable: true })
  batchId: number | null;

  @ManyToOne(() => AnnotationBatch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'batchId' })
  batch?: AnnotationBatch;

  @Column({ nullable: true })
  createdById: number | null;

  @Column({ nullable: true })
  acceptedById: number | null;

  /**
   * Incremented on every save. Served as `mmu:version`; an update sent with an
   * older `expectedVersion` is refused (someone else saved meanwhile).
   */
  @VersionColumn({ default: 1 })
  version: number;

  /** True once a person has edited an AI annotation: revert keeps it. */
  @Column({ default: false })
  editedByHuman: boolean;

  /** Model id for AI annotations, e.g. `claude-opus-5-5`. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
