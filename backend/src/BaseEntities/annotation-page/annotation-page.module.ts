import { forwardRef, Module } from '@nestjs/common';
import { AnnotationPageService } from './annotation-page.service';
import { AnnotationPageController } from './annotation-page.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnotationPage } from './entities/annotation-page.entity';
import { LinkGroupProjectModule } from '../../LinkModules/link-group-project/link-group-project.module';

@Module({
  controllers: [AnnotationPageController],
  providers: [AnnotationPageService],
  imports: [
    TypeOrmModule.forFeature([AnnotationPage]),
    // Circular at module level only: LinkGroupProjectModule imports this
    // module for snapshots, and this controller needs its rights check.
    forwardRef(() => LinkGroupProjectModule),
  ],
  exports: [AnnotationPageService],
})
export class AnnotationPageModule {}
