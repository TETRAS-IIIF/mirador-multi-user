import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AnnotationBatchStatus {
  RUNNING = 'running',
  DONE = 'done',
  CANCELLED = 'cancelled',
  REVERTED = 'reverted',
}

/** One row per assistant job that writes annotations (a chat turn or a bulk run). */
@Entity()
@Index(['projectId'])
export class AnnotationBatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column()
  createdById: number;

  /** transcribe | tag | describe | translate | chat | ... */
  @Column({ length: 32 })
  kind: string;

  /** What the job covers: manifest, canvas list, region... */
  @Column({ type: 'json', nullable: true })
  scope: any;

  @Column({ length: 100 })
  model: string;

  /** Snapshot of the prompt / project instructions used. */
  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @Column({
    type: 'enum',
    enum: AnnotationBatchStatus,
    default: AnnotationBatchStatus.RUNNING,
  })
  status: AnnotationBatchStatus;

  /** Number of drafts written by the job (never decremented). */
  @Column({ default: 0 })
  proposedCount: number;

  @Column({ default: 0 })
  inputTokens: number;

  @Column({ default: 0 })
  outputTokens: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
