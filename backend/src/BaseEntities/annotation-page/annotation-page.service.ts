import { Injectable } from '@nestjs/common';
import { CreateAnnotationPageDto } from './dto/create-annotation-page.dto';
import { AnnotationService, Caller } from '../annotation/annotation.service';

/**
 * Page-level view over the `annotation` rows. The routes keep their former
 * contract: a page is returned as `[{ id, projectId, annotationPageId,
 * content }]`, with `content` a IIIF AnnotationPage.
 */
@Injectable()
export class AnnotationPageService {
  constructor(private readonly annotationService: AnnotationService) {}

  /** Whole-page upsert (older clients): syncs rows with `content.items`. */
  async create(dto: CreateAnnotationPageDto, caller: Caller) {
    return this.annotationService.replacePage(
      Number(dto.projectId),
      dto.annotationPageId,
      dto.content,
      caller,
    );
  }

  /** Published annotations of every page of the project (snapshots, exports, tables). */
  async findAllProjectAnnotation(projectId: number) {
    return this.annotationService.getProjectPages(Number(projectId), {
      forExport: true,
    });
  }

  async findAll(annotPageId: string, projectId: number, includeDrafts = false) {
    return this.annotationService.getPage(
      Number(projectId),
      annotPageId,
      includeDrafts,
    );
  }

  async findOne(
    annotationPageId: string,
    projectId: number,
    includeDrafts = false,
  ) {
    const [page] = await this.annotationService.getPage(
      Number(projectId),
      annotationPageId,
      includeDrafts,
    );
    return page ?? null;
  }

  async deleteAnnotationPage(annotationPageId: string, projectId: number) {
    return this.annotationService.deletePage(
      Number(projectId),
      annotationPageId,
    );
  }
}
