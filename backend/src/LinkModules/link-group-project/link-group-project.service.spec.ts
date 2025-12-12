import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Repository } from 'typeorm';

import { LinkGroupProjectService } from './link-group-project.service';
import { LinkGroupProject } from './entities/link-group-project.entity';
import { ProjectService } from '../../BaseEntities/project/project.service';
import { UserGroupService } from '../../BaseEntities/user-group/user-group.service';
import { LinkUserGroupService } from '../link-user-group/link-user-group.service';
import { SnapshotService } from '../../BaseEntities/snapshot/snapshot.service';
import { AnnotationPageService } from '../../BaseEntities/annotation-page/annotation-page.service';
import { MetadataService } from '../../BaseEntities/metadata/metadata.service';
import { GroupProjectRights } from '../../enum/rights';
import { ActionType } from '../../enum/actions';
import { UpdateAccessToProjectDto } from './dto/updateAccessToProjectDto';
import { UserGroup } from '../../BaseEntities/user-group/entities/user-group.entity';

describe('LinkGroupProjectService', () => {
  let service: LinkGroupProjectService;
  let repo: jest.Mocked<Repository<LinkGroupProject>>;
  let projectService: jest.Mocked<ProjectService>;
  let groupService: jest.Mocked<UserGroupService>;
  let linkUserGroupService: jest.Mocked<LinkUserGroupService>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let snapshotService: jest.Mocked<SnapshotService>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let annotationPageService: jest.Mocked<AnnotationPageService>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let metadataService: jest.Mocked<MetadataService>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<LinkGroupProject>>> = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const projectServiceMock: Partial<jest.Mocked<ProjectService>> = {
      findOne: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
      lockProject: jest.fn(),
      findProjectsByPartialNameAndUserGroup: jest.fn(),
    };

    const groupServiceMock: Partial<jest.Mocked<UserGroupService>> = {
      findOne: jest.fn(),
      findUserPersonalGroup: jest.fn(),
    };

    const linkUserGroupServiceMock: Partial<jest.Mocked<LinkUserGroupService>> =
      {
        findUserPersonalGroup: jest.fn(),
        findALlGroupsForUser: jest.fn(),
      };

    const snapshotServiceMock: Partial<jest.Mocked<SnapshotService>> = {
      createSnapshot: jest.fn(),
      findOne: jest.fn(),
      updateSnapshot: jest.fn(),
      deleteSnapshot: jest.fn(),
    };

    const annotationPageServiceMock: Partial<
      jest.Mocked<AnnotationPageService>
    > = {
      findAllProjectAnnotation: jest.fn(),
    };

    const metadataServiceMock: Partial<jest.Mocked<MetadataService>> = {
      duplicateMetadata: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkGroupProjectService,
        {
          provide: getRepositoryToken(LinkGroupProject),
          useValue: repoMock,
        },
        { provide: ProjectService, useValue: projectServiceMock },
        { provide: UserGroupService, useValue: groupServiceMock },
        { provide: LinkUserGroupService, useValue: linkUserGroupServiceMock },
        { provide: SnapshotService, useValue: snapshotServiceMock },
        { provide: AnnotationPageService, useValue: annotationPageServiceMock },
        { provide: MetadataService, useValue: metadataServiceMock },
      ],
    }).compile();

    service = module.get(LinkGroupProjectService);
    repo = module.get(getRepositoryToken(LinkGroupProject)) as jest.Mocked<
      Repository<LinkGroupProject>
    >;
    projectService = module.get(ProjectService) as jest.Mocked<ProjectService>;
    groupService = module.get(
      UserGroupService,
    ) as jest.Mocked<UserGroupService>;
    linkUserGroupService = module.get(
      LinkUserGroupService,
    ) as jest.Mocked<LinkUserGroupService>;
    snapshotService = module.get(
      SnapshotService,
    ) as jest.Mocked<SnapshotService>;
    annotationPageService = module.get(
      AnnotationPageService,
    ) as jest.Mocked<AnnotationPageService>;
    metadataService = module.get(
      MetadataService,
    ) as jest.Mocked<MetadataService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkPolicies', () => {
    it('returns ForbiddenException when user has no linkEntity', async () => {
      jest.spyOn(service, 'getHighestRightForProject').mockResolvedValue(null);

      const callback = jest.fn();

      const result = await service.checkPolicies(
        ActionType.READ,
        1,
        1,
        callback,
      );

      expect(callback).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(ForbiddenException);
    });

    it('executes callback when READ and rights >= READER', async () => {
      const linkEntity = {
        rights: GroupProjectRights.READER,
      } as LinkGroupProject;

      jest
        .spyOn(service, 'getHighestRightForProject')
        .mockResolvedValue(linkEntity);

      const callback = jest.fn().mockResolvedValue('ok');

      const result = await service.checkPolicies(
        ActionType.READ,
        1,
        1,
        callback,
      );

      expect(callback).toHaveBeenCalledWith(linkEntity);
      expect(result).toBe('ok');
    });

    it('returns ForbiddenException when UPDATE and rights are only READER', async () => {
      const linkEntity = {
        rights: GroupProjectRights.READER,
      } as LinkGroupProject;

      jest
        .spyOn(service, 'getHighestRightForProject')
        .mockResolvedValue(linkEntity);

      const callback = jest.fn();

      const result = await service.checkPolicies(
        ActionType.UPDATE,
        1,
        1,
        callback,
      );

      expect(callback).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(ForbiddenException);
    });
  });

  describe('updateAccessToProject', () => {
    it('throws ForbiddenException when trying to give higher rights than current user', async () => {
      const dto: UpdateAccessToProjectDto = {
        projectId: 1,
        groupId: 2,
        rights: GroupProjectRights.ADMIN,
      } as any;

      // userRightOnProject = READER
      jest.spyOn(service, 'getHighestRightForProject').mockResolvedValue({
        rights: GroupProjectRights.READER,
      } as any);

      await expect(
        service.updateAccessToProject(dto, 10),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('updates linkGroupProject when allowed', async () => {
      const dto: UpdateAccessToProjectDto = {
        projectId: 1,
        groupId: 2,
        rights: GroupProjectRights.READER,
      } as any;

      // current user has ADMIN -> can lower rights
      jest.spyOn(service, 'getHighestRightForProject').mockResolvedValue({
        rights: GroupProjectRights.ADMIN,
      } as any);

      projectService.findOne.mockResolvedValue({ id: 1 } as any);
      groupService.findOne.mockResolvedValue({ id: 2 } as any);
      repo.findOne.mockResolvedValue({ id: 5 } as any);
      const updateResult = { affected: 1 };
      repo.update.mockResolvedValue(updateResult as any);

      const result = await service.updateAccessToProject(dto, 10);

      expect(projectService.findOne).toHaveBeenCalledWith(1);
      expect(groupService.findOne).toHaveBeenCalledWith(2);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { project: { id: 1 }, user_group: { id: 2 } },
      });
      expect(repo.update).toHaveBeenCalledWith(5, {
        user_group: { id: 2 },
        project: { id: 1 },
        rights: dto.rights,
      });
      expect(result).toBe(updateResult);
    });
  });

  describe('getHighestRightForProject', () => {
    it('returns null when no links found', async () => {
      const userPersonalGroup = { id: 1 } as UserGroup;
      groupService.findUserPersonalGroup.mockResolvedValue(userPersonalGroup);
      linkUserGroupService.findALlGroupsForUser.mockResolvedValue([] as any);

      repo.find.mockResolvedValue([] as any);

      const result = await service.getHighestRightForProject(10, 123);

      expect(result).toBeNull();
    });

    it('returns link with highest rights among all groups', async () => {
      const userPersonalGroup = { id: 1 } as UserGroup;
      groupService.findUserPersonalGroup.mockResolvedValue(userPersonalGroup);
      linkUserGroupService.findALlGroupsForUser.mockResolvedValue([
        { id: 2 } as UserGroup,
        { id: 3 } as UserGroup,
      ] as any);

      // order: group 2, group 3, personal group 1
      repo.find
        .mockResolvedValueOnce([{ rights: GroupProjectRights.READER } as any]) // group 2
        .mockResolvedValueOnce([{ rights: GroupProjectRights.EDITOR } as any]) // group 3
        .mockResolvedValueOnce([{ rights: GroupProjectRights.ADMIN } as any]); // personal group

      const result = await service.getHighestRightForProject(10, 123);

      expect(repo.find).toHaveBeenCalledTimes(3);
      expect(result.rights).toBe(GroupProjectRights.ADMIN);
    });
  });

  describe('isProjectLocked', () => {
    it('returns false when project has no lock', async () => {
      projectService.findOne.mockResolvedValue({
        id: 1,
        lockedByUserId: null,
        lockedAt: null,
      } as any);

      const result = await service.isProjectLocked(1, 10);

      expect(projectService.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(false);
    });

    it('returns -1 when user is the one who locked the project', async () => {
      projectService.findOne.mockResolvedValue({
        id: 1,
        lockedByUserId: 10,
        lockedAt: new Date().toISOString(),
      } as any);

      const result = await service.isProjectLocked(1, 10);

      expect(result).toBe(-1);
    });

    it('returns lockedByUserId when lock is still relevant and from another user', async () => {
      projectService.findOne.mockResolvedValue({
        id: 1,
        lockedByUserId: 20,
        lockedAt: new Date(Date.now() - 60 * 1000).toISOString(),
      } as any);

      const result = await service.isProjectLocked(1, 10);

      expect(result).toBe(20);
    });

    it('returns false when lock is stale (older than 2 minutes)', async () => {
      projectService.findOne.mockResolvedValue({
        id: 1,
        lockedByUserId: 20,
        lockedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      } as any);

      const result = await service.isProjectLocked(1, 10);

      expect(result).toBe(false);
    });

    it('wraps errors in InternalServerErrorException', async () => {
      projectService.findOne.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(service.isProjectLocked(1, 10)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
