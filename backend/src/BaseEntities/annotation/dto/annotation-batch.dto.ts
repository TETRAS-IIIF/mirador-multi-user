import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { AnnotationBatchStatus } from '../entities/annotation-batch.entity';

export class CreateAnnotationBatchDto {
  @IsInt()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  kind: string;

  @IsOptional()
  scope?: any;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  model: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}

export class UpdateAnnotationBatchDto {
  @IsOptional()
  @IsIn(Object.values(AnnotationBatchStatus))
  status?: AnnotationBatchStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  inputTokens?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  outputTokens?: number;
}
