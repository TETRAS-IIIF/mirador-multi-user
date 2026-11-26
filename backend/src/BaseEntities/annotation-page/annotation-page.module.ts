import { forwardRef, Module } from '@nestjs/common';
import { AnnotationPageService } from './annotation-page.service';
import { AnnotationPageController } from './annotation-page.controller';
import { LinkGroupProjectModule } from '../../LinkModules/link-group-project/link-group-project.module';
import { AnnotationModule } from '../annotation/annotation.module';

@Module({
  controllers: [AnnotationPageController],
  providers: [AnnotationPageService],
  imports: [
    // Annotations are stored as rows; this module is the page-level view.
    forwardRef(() => AnnotationModule),
    // Circular at module level only: LinkGroupProjectModule imports this
    // module for snapshots, and this controller needs its rights check.
    forwardRef(() => LinkGroupProjectModule),
  ],
  exports: [AnnotationPageService],
})
export class AnnotationPageModule {}
