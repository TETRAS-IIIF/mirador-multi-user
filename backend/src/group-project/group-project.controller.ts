import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GroupProjectService } from './group-project.service';
import { AddProjectToGroupDto } from './dto/addProjectToGroupDto';
import { CreateProjectDto } from '../project/dto/create-project.dto';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateProjectGroupDto } from './dto/updateProjectGroupDto';

@Controller('group-project')
export class GroupProjectController {
  constructor(private readonly groupProjectService: GroupProjectService) {}

  @Get('/:groupId')
  getAllGroupProjects(@Param('groupId') groupId: number) {
    return this.groupProjectService.getAllGroupProjects(groupId);
  }

  @Get('/project/:projectId/:userGroupId')
  getProjectForUser(
    @Param('projectId') projectId: number,
    @Param('userGroupId') userGroupId: number,
  ) {
    return this.groupProjectService.getProjectRightForUser(
      projectId,
      userGroupId,
    );
  }

  @Post('/project/add')
  addProjectToGroup(@Body() addProjectToGroupDto: AddProjectToGroupDto) {
    return this.groupProjectService.addProjectToGroup(addProjectToGroupDto);
  }

  @Post('/project/')
  createProject(@Body() createProjectDto: CreateProjectDto) {
    return this.groupProjectService.createProject(createProjectDto);
  }

  @Patch('/updateProject/')
  @UseGuards(AuthGuard)
  update(@Body() UpdateProjectGroupDto: UpdateProjectGroupDto) {
    return this.groupProjectService.updateProject(UpdateProjectGroupDto);
  }

  @Get('/search/:UserGroupId/:partialProjectName')
  lookingForProject(
    @Param('partialProjectName') partialProjectName: string,
    @Param('UserGroupId') userId: number,
  ) {
    return this.groupProjectService.searchForUserGroupProjectWithPartialProjectName(
      partialProjectName,
      userId,
    );
  }

  @Delete('/project/:projectId/:groupId')
  deleteGroupProjectLink(
    @Param('projectId') projectId: number,
    @Param('groupId') groupId: number,
  ) {
    console.log(projectId, groupId);
    return this.groupProjectService.RemoveProjectToGroup({
      projectId,
      groupId,
    });
  }
}
