import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { LinkGroupProjectService } from '../../LinkModules/link-group-project/link-group-project.service';
import {
  assertProjectRight,
  READ_RIGHTS,
  WRITE_RIGHTS,
} from '../../utils/project-rights';
import { AnnotationService, Caller } from './annotation.service';
import {
  AnnotationFilterDto,
  CreateAnnotationDto,
  UpdateAnnotationDto,
} from './dto/annotation.dto';
import {
  AnnotationOrigin,
  AnnotationStatus,
} from './entities/annotation.entity';
import { isAssistantRequest } from './annotation.utils';

export const callerFrom = (request: any): Caller => ({
  id: request.user.sub,
  name: request.user.user,
  assistant: isAssistantRequest(request),
});

/** Builds a filter from query params; 400 on unknown values. */
export function parseFilter(query: Record<string, any>): AnnotationFilterDto {
  const projectId = Number(query.projectId);
  if (!Number.isInteger(projectId)) {
    throw new BadRequestException('projectId is required');
  }
  const filter: AnnotationFilterDto = { projectId };
  if (query.annotationPageId) {
    filter.annotationPageId = String(query.annotationPageId);
  }
  if (query.status) {
    if (!Object.values(AnnotationStatus).includes(query.status)) {
      throw new BadRequestException(`Unknown status ${query.status}`);
    }
    filter.status = query.status;
  }
  if (query.origin) {
    if (!Object.values(AnnotationOrigin).includes(query.origin)) {
      throw new BadRequestException(`Unknown origin ${query.origin}`);
    }
    filter.origin = query.origin;
  }
  if (query.batchId !== undefined && query.batchId !== '') {
    const batchId = Number(query.batchId);
    if (!Number.isInteger(batchId)) {
      throw new BadRequestException('batchId must be an integer');
    }
    filter.batchId = batchId;
  }
  return filter;
}

/**
 * Per-annotation routes. Reading published annotations needs read rights on
 * the project; drafts and every write need editor or admin rights.
 */
@Controller('annotation')
@UseGuards(AuthGuard)
export class AnnotationController {
  constructor(
    private readonly annotationService: AnnotationService,
    @Inject(forwardRef(() => LinkGroupProjectService))
    private readonly links: LinkGroupProjectService,
  ) {}

  private async assertRead(request: any, filter: AnnotationFilterDto) {
    const rights =
      filter.status === AnnotationStatus.PUBLISHED ? READ_RIGHTS : WRITE_RIGHTS;
    await assertProjectRight(
      this.links,
      request.user.sub,
      filter.projectId,
      rights,
    );
  }

  @ApiOperation({ summary: 'List annotations of a project (filters in query)' })
  @Get()
  async list(@Query() query: Record<string, any>, @Req() request) {
    const filter = parseFilter(query);
    await this.assertRead(request, filter);
    return this.annotationService.list(filter);
  }

  @ApiOperation({ summary: 'Count annotations (e.g. drafts to review)' })
  @Get('count')
  async count(@Query() query: Record<string, any>, @Req() request) {
    const filter = parseFilter(query);
    await this.assertRead(request, filter);
    if (query.groupBy === 'page') {
      return this.annotationService.countByPage(filter);
    }
    return this.annotationService.count(filter);
  }

  @ApiOperation({ summary: 'Create one annotation' })
  @Post()
  async create(@Body() dto: CreateAnnotationDto, @Req() request) {
    await assertProjectRight(
      this.links,
      request.user.sub,
      dto.projectId,
      WRITE_RIGHTS,
    );
    return this.annotationService.create(dto, callerFrom(request));
  }

  @ApiOperation({ summary: 'Accept drafts in bulk (filters in query)' })
  @Post('accept')
  async bulkAccept(@Query() query: Record<string, any>, @Req() request) {
    const filter = parseFilter(query);
    await assertProjectRight(
      this.links,
      request.user.sub,
      filter.projectId,
      WRITE_RIGHTS,
    );
    return this.annotationService.bulkAccept(filter, callerFrom(request));
  }

  @ApiOperation({ summary: 'Delete annotations in bulk (filters in query)' })
  @Delete()
  async bulkDelete(@Query() query: Record<string, any>, @Req() request) {
    const filter = parseFilter(query);
    await assertProjectRight(
      this.links,
      request.user.sub,
      filter.projectId,
      WRITE_RIGHTS,
    );
    return this.annotationService.bulkDelete(filter, callerFrom(request));
  }

  @ApiOperation({ summary: 'Get one annotation' })
  @Get(':projectId/:annotationId')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('annotationId') annotationId: string,
    @Req() request,
  ) {
    const right = await assertProjectRight(
      this.links,
      request.user.sub,
      Number(projectId),
      READ_RIGHTS,
    );
    const row = await this.annotationService.getOne(
      Number(projectId),
      annotationId,
    );
    if (
      row.status === AnnotationStatus.DRAFT &&
      !WRITE_RIGHTS.includes(right)
    ) {
      // Readers never see drafts, not even their existence.
      throw new NotFoundException(`Annotation ${annotationId} not found`);
    }
    return row;
  }

  @ApiOperation({
    summary: 'Update one annotation; status=published accepts a draft',
  })
  @Patch(':projectId/:annotationId')
  async update(
    @Param('projectId') projectId: string,
    @Param('annotationId') annotationId: string,
    @Body() dto: UpdateAnnotationDto,
    @Req() request,
  ) {
    await assertProjectRight(
      this.links,
      request.user.sub,
      Number(projectId),
      WRITE_RIGHTS,
    );
    return this.annotationService.update(
      Number(projectId),
      annotationId,
      dto,
      callerFrom(request),
    );
  }

  @ApiOperation({ summary: 'Accept one draft' })
  @Post(':projectId/:annotationId/accept')
  async accept(
    @Param('projectId') projectId: string,
    @Param('annotationId') annotationId: string,
    @Req() request,
  ) {
    await assertProjectRight(
      this.links,
      request.user.sub,
      Number(projectId),
      WRITE_RIGHTS,
    );
    return this.annotationService.accept(
      Number(projectId),
      annotationId,
      callerFrom(request),
    );
  }

  @ApiOperation({ summary: 'Delete (or reject) one annotation' })
  @Delete(':projectId/:annotationId')
  async remove(
    @Param('projectId') projectId: string,
    @Param('annotationId') annotationId: string,
    @Req() request,
  ) {
    await assertProjectRight(
      this.links,
      request.user.sub,
      Number(projectId),
      WRITE_RIGHTS,
    );
    return this.annotationService.remove(
      Number(projectId),
      annotationId,
      callerFrom(request),
    );
  }
}
