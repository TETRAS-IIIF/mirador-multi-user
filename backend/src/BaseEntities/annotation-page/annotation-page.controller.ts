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
  Req,
  UseGuards,
} from '@nestjs/common';
import { AnnotationPageService } from './annotation-page.service';
import { CreateAnnotationPageDto } from './dto/create-annotation-page.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { ApiOperation } from '@nestjs/swagger';
import { LinkGroupProjectService } from '../../LinkModules/link-group-project/link-group-project.service';
import { GroupProjectRights } from '../../enum/rights';

const READ_RIGHTS = [
  GroupProjectRights.READER,
  GroupProjectRights.EDITOR,
  GroupProjectRights.ADMIN,
];
const WRITE_RIGHTS = [GroupProjectRights.EDITOR, GroupProjectRights.ADMIN];

@Controller('annotation-page')
export class AnnotationPageController {
  constructor(
    private readonly annotationPageService: AnnotationPageService,
    @Inject(forwardRef(() => LinkGroupProjectService))
    private readonly linkGroupProjectService: LinkGroupProjectService,
  ) {}

  /**
   * Throws 403 unless the user has one of `allowed` rights on the project.
   * Unlike LinkGroupProjectService.checkPolicies, this throws instead of
   * returning the exception, so the client gets a real 403.
   */
  private async assertProjectRight(
    userId: number,
    projectId: number,
    allowed: GroupProjectRights[],
  ): Promise<void> {
    const link = await this.linkGroupProjectService.getHighestRightForProject(
      userId,
      Number(projectId),
    );
    if (!link || !allowed.includes(link.rights)) {
      throw new ForbiddenException(
        'User does not have the required rights on this project',
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
    await this.assertProjectRight(
      request.user.sub,
      createAnnotationPageDto.projectId,
      WRITE_RIGHTS,
    );
    return this.annotationPageService.create(createAnnotationPageDto);
  }

  @ApiOperation({ summary: 'finding all annotation page' })
  @UseGuards(AuthGuard)
  @Get('/:annotPageId/:projectId')
  async findAll(
    @Param('projectId') projectId: number,
    @Param('annotPageId') annotPageId: string,
    @Req() request,
  ) {
    await this.assertProjectRight(request.user.sub, projectId, READ_RIGHTS);
    return this.annotationPageService.findAll(annotPageId, projectId);
  }

  @ApiOperation({ summary: 'finding an annotation page' })
  @UseGuards(AuthGuard)
  @Get(':annotationPageId/:projectId')
  async findOne(
    @Param('annotationPageId') annotationPageId: string,
    @Param('projectId') projectId: number,
    @Req() request,
  ) {
    await this.assertProjectRight(request.user.sub, projectId, READ_RIGHTS);
    const decodedURI = decodeURIComponent(annotationPageId);
    return this.annotationPageService.findOne(decodedURI, projectId);
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
    await this.assertProjectRight(request.user.sub, projectId, WRITE_RIGHTS);
    const decodedURI = decodeURIComponent(annotationPageId);
    return this.annotationPageService.deleteAnnotationPage(
      decodedURI,
      projectId,
    );
  }
}
