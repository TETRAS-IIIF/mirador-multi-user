import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateLinkGroupProjectDto } from './dto/create-link-group-project.dto';
import { UpdateLinkGroupProjectDto } from './dto/update-link-group-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LinkGroupProject } from './entities/link-group-project.entity';
import { Repository } from 'typeorm';
import { UserGroup } from '../../BaseEntities/user-group/entities/user-group.entity';
import { GroupProjectRights, PROJECT_RIGHTS_PRIORITY } from '../../enum/rights';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';
import { UpdateProjectGroupDto } from './dto/updateProjectGroupDto';
import { ProjectService } from '../../BaseEntities/project/project.service';
import { UserGroupService } from '../../BaseEntities/user-group/user-group.service';
import { AddProjectToGroupDto } from './dto/addProjectToGroupDto';
import { removeProjectToGroupDto } from './dto/removeProjectToGroupDto';
import { CreateProjectDto } from '../../BaseEntities/project/dto/create-project.dto';
import { LinkUserGroupService } from '../link-user-group/link-user-group.service';
import { Project } from '../../BaseEntities/project/entities/project.entity';
import { UpdateAccessToProjectDto } from './dto/updateAccessToProjectDto';
import { ActionType } from '../../enum/actions';
import { UserGroupTypes } from '../../enum/user-group-types';
import { SnapshotService } from '../../BaseEntities/snapshot/snapshot.service';
import { CreateSnapshotDto } from '../../BaseEntities/snapshot/dto/create-snapshot.dto';
import {
  DEFAULT_PROJECT_SNAPSHOT_FILE_NAME,
  UPLOAD_FOLDER,
} from '../../utils/constants';
import * as fs from 'node:fs';
import { generateAlphanumericSHA1Hash } from '../../utils/hashGenerator';

@Injectable()
export class LinkGroupProjectService {
  private readonly logger = new CustomLogger();

  constructor(
    @InjectRepository(LinkGroupProject)
    private readonly linkGroupProjectRepository: Repository<LinkGroupProject>,
    private readonly projectService: ProjectService,
    private readonly groupService: UserGroupService,
    private readonly linkUserGroupService: LinkUserGroupService,
    private readonly snapshotService: SnapshotService,
  ) {}

  async create(createLinkGroupProjectDto: CreateLinkGroupProjectDto) {
    try {
      const linkGroupProject: LinkGroupProject =
        this.linkGroupProjectRepository.create({
          ...createLinkGroupProjectDto,
        });

      return await this.linkGroupProjectRepository.upsert(linkGroupProject, {
        conflictPaths: ['rights', 'project', 'user_group'],
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while creating the linkGroupProject',
        error,
      );
    }
  }

  async findOne(id: number) {
    try {
      return await this.linkGroupProjectRepository.findOneBy({ id });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while finding the linkGroupProject',
        error,
      );
    }
  }

  async findAllGroupProjectByUserGroupId(userId: number) {
    try {
      return await this.linkGroupProjectRepository.find({
        where: { user_group: { id: userId } },
        relations: ['project', 'project.snapshots', 'user_group'],
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `An error occurred while finding Group for this project id : ${userId}`,
        error,
      );
    }
  }

  async update(
    linkGroupId: number,
    updateLinkGroupProjectDto: UpdateLinkGroupProjectDto,
  ) {
    try {
      const done = await this.linkGroupProjectRepository.update(
        linkGroupId,
        updateLinkGroupProjectDto,
      );
      if (done.affected != 1) throw new NotFoundException(linkGroupId);
      return this.findOne(linkGroupId);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while updating the linkGroupProject',
        error,
      );
    }
  }

  async duplicateProject(
    projectId: number,
    userId: number,
  ): Promise<LinkGroupProject> {
    try {
      const originalProject = await this.linkGroupProjectRepository.findOne({
        where: { project: { id: projectId } },
        relations: ['project', 'user_group'],
      });
      if (!originalProject) {
        throw new NotFoundException(`Object with ID ${projectId} not found`);
      }
      return await this.createProject({
        title: originalProject.project.title,
        ownerId: userId,
        metadata: originalProject.project.metadata,
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error);
    }
  }

  async getProjectRelations(projectId: number) {
    try {
      const listOfGroups = await this.linkGroupProjectRepository.find({
        where: { project: { id: projectId } },
        relations: ['user_group'],
      });

      return await Promise.all(
        listOfGroups.map(async (group) => {
          const personalOwnerGroup =
            await this.groupService.findUserPersonalGroup(
              group.user_group.ownerId,
            );

          return { ...group, personalOwnerGroupId: personalOwnerGroup.id };
        }),
      );
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error);
    }
  }

  async removeProjectFromUser(projectId: number, userId: number) {
    try {
      const personalGroup =
        await this.groupService.findUserPersonalGroup(userId);
      return await this.RemoveProjectToGroup({
        projectId: projectId,
        groupId: personalGroup.id,
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error);
    }
  }

  async UpdateRelation(
    project_Id: number,
    user_group_Id: number,
    updatedRights: GroupProjectRights,
  ) {
    try {
      // Fetch the LinkGroupProject entity
      const linkGroupToUpdate = await this.linkGroupProjectRepository.findOne({
        where: {
          user_group: { id: user_group_Id },
          project: { id: project_Id },
        },
      });

      // Ensure that the entity exists
      if (!linkGroupToUpdate) {
        throw new NotFoundException('No matching LinkGroupProject found');
      }

      linkGroupToUpdate.rights = updatedRights;
      const updatedData =
        await this.linkGroupProjectRepository.save(linkGroupToUpdate);

      return updatedData;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error);
    }
  }

  async removeProjectGroupRelation(projectId: number, group: UserGroup) {
    try {
      const done = await this.linkGroupProjectRepository.delete({
        project: { id: projectId },
        user_group: { id: group.id },
      });
      if (done.affected != 1) throw new NotFoundException(projectId);
      return done;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while removing the linkGroupProject',
        error,
      );
    }
  }

  async updateProject(dto: UpdateProjectGroupDto) {
    try {
      let projectToReturn;
      if (dto.rights && dto.group) {
        await this.UpdateRelation(dto.project.id, dto.group.id, dto.rights);
        await this.projectService.update(dto.project.id, dto.project);
        projectToReturn = await this.getProjectRelations(dto.id);
      } else {
        projectToReturn = await this.projectService.update(
          dto.project.id,
          dto.project,
        );
      }
      return projectToReturn;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error);
    }
  }

  async updateAccessToProject(
    updateAccessToProjectDto: UpdateAccessToProjectDto,
  ) {
    try {
      const projectToUpdate = await this.projectService.findOne(
        updateAccessToProjectDto.projectId,
      );
      const groupToUpdate = await this.groupService.findOne(
        updateAccessToProjectDto.groupId,
      );
      const linkGroupToUpdate = await this.linkGroupProjectRepository.findOne({
        where: {
          project: { id: projectToUpdate.id },
          user_group: { id: groupToUpdate.id },
        },
      });
      const updateRights = await this.linkGroupProjectRepository.update(
        linkGroupToUpdate.id,
        {
          user_group: groupToUpdate,
          project: projectToUpdate,
          rights: updateAccessToProjectDto.rights,
        },
      );

      return updateRights;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while trying to update access to project with id ${updateAccessToProjectDto.projectId} to group with id: ${updateAccessToProjectDto.groupId}`,
        error,
      );
    }
  }

  async addProjectToGroup(dto: AddProjectToGroupDto) {
    const { groupId, projectId } = dto;
    try {
      const userGroup = await this.groupService.findOne(groupId);
      if (!userGroup) {
        throw new InternalServerErrorException(
          `Group with id ${groupId} not found`,
        );
      }
      const project = await this.projectService.findOne(projectId);
      if (!project) {
        throw new InternalServerErrorException(
          `Project with id ${projectId} not found`,
        );
      }
      await this.create({
        rights: dto.rights ? dto.rights : GroupProjectRights.READER,
        user_group: userGroup,
        project: project,
      });
      return await this.findAllGroupProjectByUserGroupId(projectId);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while trying to add project id ${dto.projectId} to group id: ${dto.groupId}`,
        error,
      );
    }
  }

  async deleteProject(project_id: number) {
    try {
      const projectRelation = await this.getProjectRelations(project_id);
      for (const linkGroupProject of projectRelation) {
        await this.RemoveProjectToGroup({
          projectId: project_id,
          groupId: linkGroupProject.user_group.id,
        });
      }
      return await this.projectService.remove(project_id);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error);
    }
  }

  async RemoveProjectToGroup(dto: removeProjectToGroupDto) {
    try {
      const linkGroupProjects = await this.findAllGroupProjectByUserGroupId(
        dto.groupId,
      );

      const projectId = Number(dto.projectId);
      const projectToRemove = linkGroupProjects.find(
        (linkGroupProject) => linkGroupProject.project.id == projectId,
      );
      const groupToRemove = await this.groupService.findOne(dto.groupId);
      if (!projectToRemove) {
        throw new NotFoundException(
          `No association between Project with ID ${dto.projectId} and group with ID ${dto.groupId}`,
        );
      }
      return await this.removeProjectGroupRelation(
        projectToRemove.project.id,
        groupToRemove,
      );
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while removing project id : ${dto.projectId} from group id ${dto.groupId}`,
        error,
      );
    }
  }

  async getProjectRightForUser(userGroupId: number, projectId: number) {
    try {
      const project = await this.findAllGroupProjectByUserGroupId(userGroupId);

      return project.find(
        (linkGroupProject) => linkGroupProject.project.id == projectId,
      );
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error);
    }
  }

  async searchForUserGroupProjectWithPartialProjectName(
    partialUserName: string,
    userGroupId: number,
  ) {
    try {
      const arrayOfProjects =
        await this.projectService.findProjectsByPartialNameAndUserGroup(
          partialUserName,
          userGroupId,
        );
      const userProjects = [];
      for (const projets of arrayOfProjects) {
        const userPorject = await this.getProjectRightForUser(
          userGroupId,
          projets.id,
        );
        userProjects.push(userPorject);
      }
      return userProjects;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(error);
    }
  }

  async createProject(dto: CreateProjectDto) {
    try {
      const userPersonalGroup =
        await this.linkUserGroupService.findUserPersonalGroup(dto.ownerId);
      if (!userPersonalGroup) {
        throw new NotFoundException(
          `there is no user personal group for : ${dto.ownerId}`,
        );
      }
      const project = await this.projectService.create({
        ...dto,
        metadata: { ...dto.metadata, creator: userPersonalGroup.title },
      });
      await this.addProjectToGroup({
        groupId: userPersonalGroup.id,
        projectId: project.id,
        rights: GroupProjectRights.ADMIN,
      });
      return await this.getProjectRightForUser(
        userPersonalGroup.id,
        project.id,
      );
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'an error occurred while creating project',
        error,
      );
    }
  }

  async findAllUserProjects(userId: number) {
    try {
      const usersGroups =
        await this.linkUserGroupService.findALlGroupsForUser(userId);
      const projectsMap: Map<
        number,
        Project & { rights: string; share?: string }
      > = new Map();

      for (const usersGroup of usersGroups) {
        const groupProjects = await this.findAllGroupProjectByUserGroupId(
          usersGroup.id,
        );

        for (const groupProject of groupProjects) {
          const projectId = groupProject.project.id;
          const currentRights =
            PROJECT_RIGHTS_PRIORITY[groupProject.rights] || 0;

          const existingProject = projectsMap.get(projectId);

          const projectData = {
            ...groupProject.project,
            rights: groupProject.rights,
            shared: Number(groupProject.project.ownerId) !== Number(userId),
            ...(groupProject.user_group.type === UserGroupTypes.MULTI_USER && {
              share: 'group',
            }),
          };

          if (
            !existingProject ||
            currentRights > PROJECT_RIGHTS_PRIORITY[existingProject.rights]
          ) {
            projectsMap.set(projectId, projectData);
          }
        }
      }

      return Array.from(projectsMap.values());
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while finding project for userId: ${userId}`,
        error,
      );
    }
  }

  async getHighestRightForProject(userId: number, projectId: number) {
    const userPersonalGroup: UserGroup =
      await this.groupService.findUserPersonalGroup(userId);

    const userGroups: UserGroup[] =
      await this.linkUserGroupService.findALlGroupsForUser(userId);
    const allGroups = [...userGroups, userPersonalGroup];
    let linkEntities = [];
    for (const group of allGroups) {
      const linkGroups = await this.linkGroupProjectRepository.find({
        where: {
          user_group: { id: group.id },
          project: { id: projectId },
        },
        relations: ['project', 'user_group'],
      });
      linkEntities = linkEntities.concat(linkGroups);
    }

    if (linkEntities.length === 0) {
      return null;
    }

    return linkEntities.reduce((prev, current) => {
      const prevRight = PROJECT_RIGHTS_PRIORITY[prev.rights] || 0;
      const currentRight = PROJECT_RIGHTS_PRIORITY[current.rights] || 0;
      return currentRight > prevRight ? current : prev;
    });
  }

  async checkPolicies(
    action: string,
    userId: number,
    projectId: number,
    callback: (linkEntity: LinkGroupProject) => any,
  ) {
    try {
      const linkEntity = await this.getHighestRightForProject(
        userId,
        projectId,
      );

      if (!linkEntity) {
        return new ForbiddenException(
          'User does not have access to this project or the project does not exist',
        );
      }
      switch (action) {
        case ActionType.READ:
          if (
            [
              GroupProjectRights.READER,
              GroupProjectRights.ADMIN,
              GroupProjectRights.EDITOR,
            ].includes(linkEntity.rights)
          ) {
            return callback(linkEntity);
          }
          break;
        case ActionType.UPDATE:
          if (
            [GroupProjectRights.ADMIN, GroupProjectRights.EDITOR].includes(
              linkEntity.rights,
            )
          ) {
            return callback(linkEntity);
          }
          break;
        case ActionType.DELETE:
          if (linkEntity.rights === GroupProjectRights.ADMIN) {
            return callback(linkEntity);
          }
          break;

        default:
          throw new InternalServerErrorException('Invalid action');
      }
      return new ForbiddenException('User is not allowed to do this action');
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(`an error occurred`, error);
    }
  }

  async generateProjectSnapshot(
    createSnapshotDto: CreateSnapshotDto,
    creatorId: number,
  ) {
    try {
      const project = await this.projectService.findOne(
        createSnapshotDto.projectId,
      );
      const creator = await this.groupService.findUserPersonalGroup(creatorId);
      const hash = generateAlphanumericSHA1Hash(
        `${createSnapshotDto.title}${Date.now().toString()}`,
      );
      const snapShot = await this.snapshotService.createSnapshot({
        ...createSnapshotDto,
        projectId: project.id,
        hash: hash,
        creator: creator.title,
      });
      const uploadPath = `${UPLOAD_FOLDER}/${hash}`;

      fs.mkdirSync(uploadPath, { recursive: true });
      const workspaceData = {
        generated_at: Date.now(),
        workspace: project.userWorkspace,
      };
      const workspaceJsonPath = `${uploadPath}/${DEFAULT_PROJECT_SNAPSHOT_FILE_NAME}`;
      fs.writeFileSync(
        workspaceJsonPath,
        JSON.stringify(workspaceData, null, 2),
        'utf-8',
      );
      return snapShot;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while creating snapshot`,
        error,
      );
    }
  }

  async updateSnapshot(title: string, snapshotId: number, projectId: number) {
    try {
      const project = await this.projectService.findOne(projectId);
      const snapshotToUpdate = await this.snapshotService.findOne(snapshotId);
      const uploadPath = `${UPLOAD_FOLDER}/${snapshotToUpdate.hash}`;
      const workspaceData = {
        generated_at: Date.now(),
        workspace: project.userWorkspace,
      };
      const workspaceJsonPath = `${uploadPath}/${DEFAULT_PROJECT_SNAPSHOT_FILE_NAME}`;
      fs.writeFileSync(
        workspaceJsonPath,
        JSON.stringify(workspaceData, null, 2),
        'utf-8',
      );
      return await this.snapshotService.updateSnapshot(snapshotId, {
        ...snapshotToUpdate,
        title: title,
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while updating snapshot`,
        error,
      );
    }
  }

  async deleteSnapshot(snapshotId: number) {
    try {
      const snapshotToDelete = await this.snapshotService.findOne(snapshotId);
      const uploadPath = `${UPLOAD_FOLDER}/${snapshotToDelete.hash}`;
      const workspaceJsonPath = `${uploadPath}/${DEFAULT_PROJECT_SNAPSHOT_FILE_NAME}`;
      //TODO: remove file located at uploadPath generate rights error on filesystem
      fs.unlinkSync(workspaceJsonPath);
      return await this.snapshotService.deleteSnapshot(snapshotId);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `an error occurred while deleting snapshot`,
        error,
      );
    }
  }

  async lockProject(projectId: number, lock: boolean, userId: number) {
    try {
      return await this.projectService.lockProject(projectId, lock, userId);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(`an error occurred`, error);
    }
  }

  async isProjectLocked(
    projectId: number,
    userId: number,
  ): Promise<boolean | number> {
    try {
      const project = await this.projectService.findOne(projectId);
      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }
      if (project.lockedByUserId === null && project.lockedAt === null) {
        return false;
      }
      const now = Date.now();
      const isLockRelevant =
        now - 2 * 60 * 1000 < new Date(project.lockedAt).getTime();
      if (isLockRelevant) {
        if (userId == project.lockedByUserId) {
        } else {
          return project.lockedByUserId;
        }
      }
      return false;
    } catch (error) {
      this.logger.error(
        `Error checking project lock: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An error occurred while checking project lock',
        error,
      );
    }
  }
}
