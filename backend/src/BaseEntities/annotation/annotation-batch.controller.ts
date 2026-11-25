import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  forwardRef,
  Get,
  Inject,
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
import { assertProjectRight, WRITE_RIGHTS } from '../../utils/project-rights';
import { AnnotationService } from './annotation.service';
import { callerFrom, parseFilter } from './annotation.controller';
import {
  CreateAnnotationBatchDto,
  UpdateAnnotationBatchDto,
} from './dto/annotation-batch.dto';

const isTrue = (value: unknown) =>
  value === true || value === 'true' || value === '1';

/** Assistant jobs. Every route needs editor or admin rights on the project. */
@Controller('annotation-batch')
@UseGuards(AuthGuard)
export class AnnotationBatchController {
  constructor(
    private readonly annotationService: AnnotationService,
    @Inject(forwardRef(() => LinkGroupProjectService))
    private readonly links: LinkGroupProjectService,
  ) {}

  private async assertBatchWrite(request: any, id: number) {
    const batch = await this.annotationService.findBatch(id);
    await assertProjectRight(
      this.links,
      request.user.sub,
      batch.projectId,
      WRITE_RIGHTS,
    );
    return batch;
  }

  private refuseAssistant(request: any) {
    if (callerFrom(request).assistant) {
      throw new ForbiddenException(
        'Only a person can accept or revert a batch',
      );
    }
  }

  @ApiOperation({ summary: 'Start a batch' })
  @Post()
  async create(@Body() dto: CreateAnnotationBatchDto, @Req() request) {
    await assertProjectRight(
      this.links,
      request.user.sub,
      dto.projectId,
      WRITE_RIGHTS,
    );
    return this.annotationService.createBatch(dto, callerFrom(request));
  }

  @ApiOperation({ summary: 'List the batches of a project' })
  @Get()
  async list(@Query() query: Record<string, any>, @Req() request) {
    const { projectId } = parseFilter(query);
    await assertProjectRight(
      this.links,
      request.user.sub,
      projectId,
      WRITE_RIGHTS,
    );
    return this.annotationService.listBatches(projectId);
  }

  @ApiOperation({ summary: 'Get a batch with its counts' })
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() request) {
    await this.assertBatchWrite(request, Number(id));
    return this.annotationService.getBatch(Number(id));
  }

  @ApiOperation({ summary: 'Update status or token usage of a batch' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAnnotationBatchDto,
    @Req() request,
  ) {
    await this.assertBatchWrite(request, Number(id));
    return this.annotationService.updateBatch(Number(id), dto);
  }

  @ApiOperation({ summary: 'Accept every draft of a batch' })
  @Post(':id/accept')
  async accept(@Param('id') id: string, @Req() request) {
    this.refuseAssistant(request);
    await this.assertBatchWrite(request, Number(id));
    return this.annotationService.acceptBatch(Number(id), callerFrom(request));
  }

  @ApiOperation({
    summary:
      'Revert a batch: delete what it wrote, except annotations a person edited (force=true deletes them too, dryRun=true only counts)',
  })
  @Post(':id/revert')
  async revert(
    @Param('id') id: string,
    @Query() query: Record<string, any>,
    @Req() request,
  ) {
    this.refuseAssistant(request);
    await this.assertBatchWrite(request, Number(id));
    return this.annotationService.revertBatch(Number(id), {
      force: isTrue(query.force),
      dryRun: isTrue(query.dryRun),
    });
  }

  @ApiOperation({ summary: 'Same as POST /annotation-batch/:id/revert' })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query() query: Record<string, any>,
    @Req() request,
  ) {
    return this.revert(id, query, request);
  }
}
