import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Brackets, DeleteResult, Repository } from 'typeorm';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';
import { MetricsService } from '../../metrics/metrics.service';

@Injectable()
export class ProjectService {
  private readonly logger = new CustomLogger();

  //Importing function from LinkTable there cause circular dependencies error, this is described into the wiki there : https://github.com/SCENE-CE/mirador-multi-user/wiki/Backend
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly metrics: MetricsService,
  ) {}

  async create(dto: CreateProjectDto): Promise<Project> {
    try {
      this.metrics.projectsCreatedTotal.inc();

      this.metrics.routeUsageTotal.inc({
        route: '/projects',
        action: 'create',
      });
      return this.projectRepository.save({
        ...dto,
        description: dto.description
          ? dto.description
          : 'Your project description here',
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while creating the project',
        error,
      );
    }
  }

  async findOne(projectId: number): Promise<Project> {
    try {
      const project = await this.projectRepository.findOneBy({ id: projectId });
      return project;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async update(projectId: number, dto: UpdateProjectDto) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { lockedByUserId, lockedAt, id, ...filteredData } = dto;

      const project = await this.projectRepository.findOne({
        where: { id: projectId },
      });
      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }
      Object.assign(project, filteredData);
      await this.projectRepository.save(project);

      return await this.findOne(projectId);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error);
    }
  }

  async findProjectsByPartialNameAndUserGroup(
    partialProjectName: string,
    userGroupId: number,
  ): Promise<Partial<Project>[]> {
    try {
      const partialProjectNameLength = partialProjectName.length;

      return await this.projectRepository
        .createQueryBuilder('project')
        .select(['project.id', 'project.title'])
        .innerJoin('project.linkGroupProjectsIds', 'linkGroupProject')
        .innerJoin('linkGroupProject.user_group', 'userGroup')
        .where('userGroup.id = :id', { id: userGroupId })
        .andWhere(
          new Brackets((qb) => {
            qb.where('LEFT(project.title, :length) = :partialProjectName', {
              length: partialProjectNameLength,
              partialProjectName,
            });
          }),
        )
        .distinct(true)
        .limit(3)
        .getMany();
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(
        'Failed to find projects by partial title and user group',
      );
    }
  }

  async remove(id: number) {
    try {
      const done: DeleteResult = await this.projectRepository.delete(id);
      if (done.affected != 1) throw new NotFoundException(id);
      return done;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error);
    }
  }

  async findProjectOwned(userId: number) {
    try {
      return await this.projectRepository.find({
        where: { ownerId: userId },
        relations: ['linkGroupProjectsIds'],
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error);
    }
  }

  async lockProject(projectId: number, lock: boolean, userId: number) {
    try {
      const updateData = lock
        ? { lockedAt: new Date(), lockedByUserId: userId }
        : { lockedAt: null, lockedByUserId: null };
      return await this.projectRepository.update(projectId, updateData);
    } catch (error) {
      this.logger.error(
        `Failed to update lock status for project ${projectId}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not update lock status.');
    }
  }
}
