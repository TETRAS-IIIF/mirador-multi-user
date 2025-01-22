import { Controller } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  //this routes shouldn't be exposed
  // @Post()
  // @UseGuards(AuthGuard)
  // async create(@Body() createProjectDto: any) {
  //   try {
  //     const createdProject = await this.projectService.create(createProjectDto);
  //     return { ...createdProject };
  //   } catch (error) {
  //     throw new BadRequestException(error);
  //   }
  // }
  //
  // @Get(':userId')
  // @UseGuards(AuthGuard)
  // @CheckPolicies((ability) => ability.can(Action.Read, Project))
  // findAll(@Param() params: FindAllParams): Promise<Project[]> {
  //   return this.projectService.findAll(params.userId);
  // }
  //
  // @Get('/individual/:id')
  // @UseGuards(AuthGuard)
  // findOne(@Param() params: FindOneParams) {
  //   return this.projectService.findOne(params.id);
  // }
  //
  // @Patch(':id')
  // @UseGuards(AuthGuard)
  // @UsePipes(new ValidationPipe({ transform: true }))
  // update(
  //   @Param() params: PatchParams,
  //   @Body() updateProjectDto: UpdateProjectDto,
  // ) {
  //   return this.projectService.update(params.id, updateProjectDto);
  // }
  //
  // @UseGuards(AuthGuard)
  // @Get('/search/:UserGroupId/:partialProjectName')
  // lookingForProject(
  //   @Param('partialProjectName') partialProjectName: string,
  //   @Param('UserGroupId') userId: number,
  // ) {
  //   return this.projectService.findProjectsByPartialNameAndUserGroup(
  //     partialProjectName,
  //     userId,
  //   );
  // }
  //
  // @Delete(':id')
  // @UseGuards(AuthGuard)
  // @UsePipes(new ValidationPipe({ transform: true }))
  // @CheckPolicies((ability) => ability.can(Action.Delete, Project))
  // remove(@Param() params: DeleteParams) {
  //   return this.projectService.remove(params.id);
  // }
}
