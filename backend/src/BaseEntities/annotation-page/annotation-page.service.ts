import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateAnnotationPageDto } from './dto/create-annotation-page.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AnnotationPage } from './entities/annotation-page.entity';
import { Repository } from 'typeorm';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';

@Injectable()
export class AnnotationPageService {
  private readonly logger = new CustomLogger();

  constructor(
    @InjectRepository(AnnotationPage)
    private readonly annotationPageRepository: Repository<AnnotationPage>,
  ) {}

  async create(createAnnotationPageDto: CreateAnnotationPageDto) {
    try {
      const annotationPage = this.annotationPageRepository.create(
        createAnnotationPageDto,
      );

      // TODO It will be better to used upsert method
      await this.annotationPageRepository.delete({
        annotationPageId: annotationPage.annotationPageId,
        projectId: annotationPage.projectId,
      });
      // Save annotationPage
      await this.annotationPageRepository.save(annotationPage);

      // Return all annotationPage. In current workflow, only one will be matching
      return this.findAll(
        annotationPage.annotationPageId,
        annotationPage.projectId,
      );
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while creating annotationPage, ${error.message}`,
      );
    }
  }

  async findAllProjectAnnotation(projectId: number) {
    try {
      return await this.annotationPageRepository.find({
        where: {
          projectId: projectId,
        },
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while creating annotationPage, ${error.message}`,
      );
    }
  }

  async findAll(annotPageId: string, projectId: number) {
    try {
      return await this.annotationPageRepository.find({
        where: { annotationPageId: annotPageId, projectId: projectId },
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while finding annotationPages, ${error.message}`,
      );
    }
  }

  async findOne(annotationPageId: string, projectId: number) {
    try {
      return await this.annotationPageRepository.findOne({
        where: { annotationPageId: annotationPageId, projectId: projectId },
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while finding annotationPage with id :${annotationPageId}, ${error.message}`,
      );
    }
  }

  async deleteAnnotationPage(annotationPageId: string, projectId: number) {
    try {
      const result = await this.annotationPageRepository.delete({
        annotationPageId,
        projectId,
      });
      if (result.affected === 0) {
        return new NotFoundException(
          `AnnotationPage with ID "${annotationPageId}" in project "${projectId}" not found.`,
        );
      }
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to delete AnnotationPage with ID "${annotationPageId}" in project "${projectId}": ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        `An error occurred while deleting the annotationPage. Please try again later.`,
      );
    }
  }
}
