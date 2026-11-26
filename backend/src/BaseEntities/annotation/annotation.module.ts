import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Annotation } from './entities/annotation.entity';
import { AnnotationBatch } from './entities/annotation-batch.entity';
import { AnnotationPage } from '../annotation-page/entities/annotation-page.entity';
import { AnnotationService } from './annotation.service';
import { AnnotationController } from './annotation.controller';
import { AnnotationBatchController } from './annotation-batch.controller';
import { LinkGroupProjectModule } from '../../LinkModules/link-group-project/link-group-project.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Annotation, AnnotationBatch, AnnotationPage]),
    // Rights checks; LinkGroupProjectModule reaches back here through
    // AnnotationPageModule for snapshots.
    forwardRef(() => LinkGroupProjectModule),
  ],
  controllers: [AnnotationController, AnnotationBatchController],
  providers: [AnnotationService],
  exports: [AnnotationService],
})
export class AnnotationModule {}
