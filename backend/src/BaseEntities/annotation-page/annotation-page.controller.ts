import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { AnnotationPageService } from './annotation-page.service';
import { CreateAnnotationPageDto } from './dto/create-annotation-page.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('annotation-page')
export class AnnotationPageController {
  constructor(private readonly annotationPageService: AnnotationPageService) {}

  @ApiOperation({ summary: 'upsert annotation page' })
  @Post()
  create(@Body() createAnnotationPageDto: CreateAnnotationPageDto) {
    return this.annotationPageService.create(createAnnotationPageDto);
  }

  @ApiOperation({ summary: 'finding all annotation page' })
  @Get('/:annotPageId/:projectId')
  findAll(
    @Param('projectId') projectId: number,
    @Param('annotPageId') annotPageId: string,
  ) {
    return this.annotationPageService.findAll(annotPageId, projectId);
  }

  @ApiOperation({ summary: 'finding an annotation page' })
  @Get(':annotationPageId/:projectId')
  findOne(
    @Param('annotationPageId') annotationPageId: string,
    @Param('projectId') projectId: number,
  ) {
    const decodedURI = decodeURIComponent(annotationPageId);
    return this.annotationPageService.findOne(decodedURI, projectId);
  }

  @Delete('/:annotationPageId/:projectId')
  delete(
    @Param('projectId') projectId: number,
    @Param('annotationPageId') annotationPageId: string,
  ) {
    const decodedURI = decodeURIComponent(annotationPageId);
    return this.annotationPageService.deleteAnnotationPage(
      decodedURI,
      projectId,
    );
  }
}
