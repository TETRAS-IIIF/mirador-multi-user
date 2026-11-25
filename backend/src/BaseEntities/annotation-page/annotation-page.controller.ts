import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  forwardRef,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AnnotationPageService } from './annotation-page.service';
import { CreateAnnotationPageDto } from './dto/create-annotation-page.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LinkGroupProjectService } from '../../LinkModules/link-group-project/link-group-project.service';
import {
  assertProjectRight,
  READ_RIGHTS,
  WRITE_RIGHTS,
} from '../../utils/project-rights';
import { isAssistantRequest } from '../annotation/annotation.utils';

const wantsDrafts = (value: unknown) => value === 'true' || value === '1';

@Controller('annotation-page')
export class AnnotationPageController {
  constructor(
    private readonly annotationPageService: AnnotationPageService,
    @Inject(forwardRef(() => LinkGroupProjectService))
    private readonly linkGroupProjectService: LinkGroupProjectService,
  ) {}

  private assertProjectRight(userId: number, projectId: number, allowed) {
    return assertProjectRight(
      this.linkGroupProjectService,
      userId,
      projectId,
      allowed,
    );
  }

  /** Drafts are only served to editors and admins of the project. */
  private async includeDrafts(request, projectId: number, drafts: unknown) {
    const right = await this.assertProjectRight(
      request.user.sub,
      projectId,
      READ_RIGHTS,
    );
    return wantsDrafts(drafts) && WRITE_RIGHTS.includes(right);
  }

  /** Page-level writes would bypass draft rules: the assistant uses /annotation. */
  private refuseAssistant(request) {
    if (isAssistantRequest(request)) {
      throw new ForbiddenException(
        'The assistant must use the /annotation routes',
      );
    }
  }

  @ApiOperation({ summary: 'upsert annotation page' })
  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body() createAnnotationPageDto: CreateAnnotationPageDto,
    @Req() request,
  ) {
    this.refuseAssistant(request);
    await this.assertProjectRight(
      request.user.sub,
      createAnnotationPageDto.projectId,
      WRITE_RIGHTS,
    );
    return this.annotationPageService.create(createAnnotationPageDto, {
      id: request.user.sub,
      name: request.user.user,
    });
  }

  @ApiOperation({ summary: 'finding all annotation page' })
  @ApiQuery({
    name: 'drafts',
    required: false,
    description: 'true to include drafts (editors only)',
  })
  @UseGuards(AuthGuard)
  @Get('/:annotPageId/:projectId')
  async findAll(
    @Param('projectId') projectId: number,
    @Param('annotPageId') annotPageId: string,
    @Query('drafts') drafts: string,
    @Req() request,
  ) {
    const include = await this.includeDrafts(request, projectId, drafts);
    return this.annotationPageService.findAll(annotPageId, projectId, include);
  }

  @ApiOperation({ summary: 'finding an annotation page' })
  @UseGuards(AuthGuard)
  @Get(':annotationPageId/:projectId')
  async findOne(
    @Param('annotationPageId') annotationPageId: string,
    @Param('projectId') projectId: number,
    @Query('drafts') drafts: string,
    @Req() request,
  ) {
    const include = await this.includeDrafts(request, projectId, drafts);
    const decodedURI = decodeURIComponent(annotationPageId);
    return this.annotationPageService.findOne(decodedURI, projectId, include);
  }

  @ApiOperation({ summary: 'find all user annotation page for project' })
  @UseGuards(AuthGuard)
  @Get('/all/:projectId/:userId')
  async findAllAnnotationForProject(
    @Param('projectId') projectId: number,
    @Param('userId') userId: number,
    @Req() request,
  ) {
    await this.assertProjectRight(request.user.sub, projectId, READ_RIGHTS);
    return await this.annotationPageService.findAllProjectAnnotation(projectId);
  }

  @ApiOperation({ summary: 'delete an annotation page' })
  @UseGuards(AuthGuard)
  @Delete('/:annotationPageId/:projectId')
  async delete(
    @Param('projectId') projectId: number,
    @Param('annotationPageId') annotationPageId: string,
    @Req() request,
  ) {
    this.refuseAssistant(request);
    await this.assertProjectRight(request.user.sub, projectId, WRITE_RIGHTS);
    const decodedURI = decodeURIComponent(annotationPageId);
    return this.annotationPageService.deleteAnnotationPage(
      decodedURI,
      projectId,
    );
  }
}
