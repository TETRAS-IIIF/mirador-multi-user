import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { LinkGroupProjectService } from './link-group-project.service';
import { AuthGuard } from '../../auth/auth.guard';
import { AddProjectToGroupDto } from './dto/addProjectToGroupDto';
import { CreateProjectDto } from '../../BaseEntities/project/dto/create-project.dto';
import { UpdateProjectGroupDto } from './dto/updateProjectGroupDto';
import { UpdateAccessToProjectDto } from './dto/updateAccessToProjectDto';
import { ActionType } from '../../enum/actions';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { LinkGroupProject } from './entities/link-group-project.entity';
import { LockProjectDto } from './dto/lockProjectDto';

@ApiBearerAuth()
@Controller('link-group-project')
export class LinkGroupProjectController {
  constructor(
    private readonly linkGroupProjectService: LinkGroupProjectService,
  ) {}

  @ApiOperation({
    summary: 'Find all Link between group and project for a specific group Id',
  })
  @UseGuards(AuthGuard)
  @Get('/:groupId')
  async getAllGroupProjects(@Param('groupId') groupId: number) {
    return await this.linkGroupProjectService.findAllGroupProjectByUserGroupId(
      groupId,
    );
  }

  @UseGuards(AuthGuard)
  @Get('/project/relation/:projectId')
  getProjectRelation(@Param('projectId') projectId: number) {
    return this.linkGroupProjectService.getProjectRelations(projectId);
  }

  @SetMetadata('action', ActionType.UPDATE)
  @UseGuards(AuthGuard)
  @Post('/project/lock')
  async handleLockProject(
    @Body() lockProjectDto: LockProjectDto,
    @Req() request,
  ) {
    return await this.linkGroupProjectService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      lockProjectDto.projectId,
      async () => {
        return this.linkGroupProjectService.lockProject(
          lockProjectDto.projectId,
          lockProjectDto.lock,
          request.user.sub,
        );
      },
    );
  }

  @ApiOperation({ summary: 'Update project relation and rights on it' })
  @ApiBody({ type: UpdateProjectGroupDto })
  @ApiOkResponse({
    description: 'The project user have access and his rights on it',
    type: LinkGroupProject,
    isArray: true,
  })
  @SetMetadata('action', ActionType.UPDATE)
  @UseGuards(AuthGuard)
  @Patch('/updateProject/')
  async update(
    @Body() updateProjectGroupDto: UpdateProjectGroupDto,
    @Req() request,
  ) {
    return await this.linkGroupProjectService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      updateProjectGroupDto.project.id,
      async () => {
        return this.linkGroupProjectService.updateProject(
          updateProjectGroupDto,
        );
      },
    );
  }

  @ApiOperation({ summary: 'Allow a group to access a project' })
  @ApiBody({ type: AddProjectToGroupDto })
  @ApiOkResponse({
    description:
      'The group that can access given project and there rights on it',
    type: LinkGroupProject,
    isArray: true,
  })
  @SetMetadata('action', ActionType.UPDATE)
  @UseGuards(AuthGuard)
  @Post('/project/add')
  async addProjectToGroup(
    @Body() addProjectToGroupDto: AddProjectToGroupDto,
    @Req() request,
  ) {
    return await this.linkGroupProjectService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      addProjectToGroupDto.projectId,
      async () => {
        return this.linkGroupProjectService.addProjectToGroup(
          addProjectToGroupDto,
        );
      },
    );
  }

  @ApiOperation({ summary: 'Change access to a project for a specific group' })
  @ApiBody({ type: UpdateAccessToProjectDto })
  @SetMetadata('action', ActionType.UPDATE)
  @UseGuards(AuthGuard)
  @Patch('/change-rights')
  @HttpCode(204)
  async updateAccessToProject(
    @Body() updateAccessToProjectDto: UpdateAccessToProjectDto,
    @Req() request,
  ) {
    return await this.linkGroupProjectService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      updateAccessToProjectDto.projectId,
      async () => {
        return this.linkGroupProjectService.updateAccessToProject(
          updateAccessToProjectDto,
          request.user.sub,
        );
      },
    );
  }

  @ApiOperation({ summary: 'delete a project' })
  @SetMetadata('action', ActionType.DELETE)
  @UseGuards(AuthGuard)
  @Delete('/delete/project/:projectId')
  async deleteProject(@Param('projectId') project_id: number, @Req() request) {
    return await this.linkGroupProjectService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      project_id,
      async (linkEntity) => {
        return this.linkGroupProjectService.deleteProject(
          linkEntity.project.id,
        );
      },
    );
  }

  @ApiOperation({ summary: 'Remove access to a project to a specific group' })
  @SetMetadata('action', ActionType.UPDATE)
  @UseGuards(AuthGuard)
  @Delete('/project/:projectId/:groupId')
  async deleteGroupProjectLink(
    @Param('projectId') projectId: number,
    @Param('groupId') groupId: number,
    @Req() request,
  ) {
    return await this.linkGroupProjectService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      projectId,
      async () => {
        return this.linkGroupProjectService.RemoveProjectToGroup({
          projectId,
          groupId,
        });
      },
    );
  }

  @ApiOperation({ summary: "Remove a project from user's list" })
  @UseGuards(AuthGuard)
  @Delete('/remove-project/:projectId')
  async removeProjectFromUser(
    @Param('projectId') projectId: number,
    @Req() request,
  ) {
    return await this.linkGroupProjectService.removeProjectFromUser(
      projectId,
      request.user.sub,
    );
  }

  //TODO: Check if this routes is usefull
  // @UseGuards(AuthGuard)
  // @Get('/project/:projectId/:userGroupId')
  // getProjectForUser(
  //   @Param('projectId') projectId: number,
  //   @Param('userGroupId') userGroupId: number,
  // ) {
  //   return this.linkGroupProjectService.getProjectRightForUser(
  //     projectId,
  //     userGroupId,
  //   );
  // }

  @ApiOperation({
    summary: 'Search for a project that a specific group can access',
  })
  @ApiOkResponse({
    description: 'The project and rights for the user on it',
    type: LinkGroupProject,
    isArray: true,
  })
  @UseGuards(AuthGuard)
  @Get('/search/:UserGroupId/:partialProjectName')
  lookingForProject(
    @Param('partialProjectName') partialProjectName: string,
    @Param('UserGroupId') userId: number,
  ) {
    return this.linkGroupProjectService.searchForUserGroupProjectWithPartialProjectName(
      partialProjectName,
      userId,
    );
  }

  @ApiOperation({ summary: 'Project creation' })
  @ApiBody({ type: CreateProjectDto })
  @UseGuards(AuthGuard)
  @Post('/project/')
  createProject(@Body() createProjectDto: CreateProjectDto) {
    return this.linkGroupProjectService.createProject(createProjectDto);
  }

  @ApiOperation({ summary: 'Get all users that can access the project' })
  @ApiOkResponse({
    description: 'The project user have access and his rights on it',
    type: LinkGroupProject,
    isArray: true,
  })
  @UseGuards(AuthGuard)
  @Get('/user/projects/:userId')
  async getAllUsersProjects(@Param('userId') userId: number, @Req() request) {
    if (request.user.sub == userId) {
      return await this.linkGroupProjectService.findAllUserProjects(userId);
    } else {
      return new UnauthorizedException(
        'you are not allowed to request for this projects',
      );
    }
  }

  @ApiOperation({ summary: 'Duplicate a project' })
  @ApiOkResponse({
    description: 'Duplicate a project',
    type: LinkGroupProject,
    isArray: true,
  })
  @SetMetadata('action', ActionType.UPDATE)
  @UseGuards(AuthGuard)
  @Post('/project/duplicate/:projectId')
  async duplicateProject(
    @Param('projectId') projectId: number,
    @Req() request,
  ) {
    return await this.linkGroupProjectService.checkPolicies(
      request.metadata.action,
      request.user.sub,
      projectId,
      async () => {
        return this.linkGroupProjectService.duplicateProject(
          projectId,
          request.user.sub,
        );
      },
    );
  }

  @ApiOperation({ summary: 'Create project snapshot' })
  @SetMetadata('action', ActionType.UPDATE)
  @UseGuards(AuthGuard)
  @Get('/snapshot/:projectId')
  async generateSnapshot(@Param('projectId') projectId: number) {
    return await this.linkGroupProjectService.generateProjectSnapshot(
      projectId,
    );
  }

  @ApiOperation({ summary: 'Check if project is lock and user can access it' })
  @UseGuards(AuthGuard)
  @Get('/project/isLocked/:projectId')
  async isLocked(@Param('projectId') projectId: number, @Req() request) {
    return await this.linkGroupProjectService.isProjectLocked(
      projectId,
      request.user.sub,
    );
  }
}
