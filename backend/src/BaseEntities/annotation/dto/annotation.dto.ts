import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  AnnotationOrigin,
  AnnotationStatus,
} from '../entities/annotation.entity';

export class CreateAnnotationDto {
  @IsInt()
  projectId: number;

  /** Canvas page id, e.g. `<canvasId>/annotationPage`. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  annotationPageId: string;

  /** W3C annotation. `content.id` becomes the annotation id. */
  @IsObject()
  content: Record<string, any>;

  @IsOptional()
  @IsIn(Object.values(AnnotationStatus))
  status?: AnnotationStatus;

  @IsOptional()
  @IsIn(Object.values(AnnotationOrigin))
  origin?: AnnotationOrigin;

  @IsOptional()
  @IsInt()
  batchId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;
}

export class UpdateAnnotationDto {
  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  /** `published` on a draft accepts it. */
  @IsOptional()
  @IsIn(Object.values(AnnotationStatus))
  status?: AnnotationStatus;

  /**
   * The `mmu:version` the client loaded. When the annotation has changed
   * since (someone else saved it), the update is refused with 409.
   */
  @IsOptional()
  @IsString()
  expectedVersion?: string;
}

/** Parsed from the query string by the controller. */
export interface AnnotationFilterDto {
  projectId: number;
  annotationPageId?: string;
  status?: AnnotationStatus;
  origin?: AnnotationOrigin;
  batchId?: number;
}
