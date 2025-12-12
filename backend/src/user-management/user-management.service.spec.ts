import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserManagementService } from './user-management.service';
import { LinkUserGroup } from '../LinkModules/link-user-group/entities/link-user-group.entity';
import { UsersService } from '../BaseEntities/users/users.service';
import { ProjectService } from '../BaseEntities/project/project.service';
import { LinkGroupProjectService } from '../LinkModules/link-group-project/link-group-project.service';
import { LinkManifestGroupService } from '../LinkModules/link-manifest-group/link-manifest-group.service';
import { ManifestService } from '../BaseEntities/manifest/manifest.service';
import { MediaService } from '../BaseEntities/media/media.service';
import { LinkMediaGroupService } from '../LinkModules/link-media-group/link-media-group.service';
import { UserGroupService } from '../BaseEntities/user-group/user-group.service';
import { ActionType } from '../enum/actions';
import { User_UserGroupRights } from '../enum/rights';

describe('UserManagementService', () => {
  let service: UserManagementService;

  let usersService: jest.Mocked<UsersService>;
  let projectService: jest.Mocked<ProjectService>;
  let linkGroupProjectService: jest.Mocked<LinkGroupProjectService>;
  let linkManifestGroupService: jest.Mocked<LinkManifestGroupService>;
  let manifestService: jest.Mocked<ManifestService>;
  let mediaService: jest.Mocked<MediaService>;
  let linkMediaGroupService: jest.Mocked<LinkMediaGroupService>;
  let userGroupService: jest.Mocked<UserGroupService>;
  let linkUserGroupRepo: jest.Mocked<Repository<LinkUserGroup>>;

  beforeEach(async () => {
    const usersServiceMock: Partial<jest.Mocked<UsersService>> = {
      deleteUser: jest.fn(),
    };

    const projectServiceMock: Partial<jest.Mocked<ProjectService>> = {
      findProjectOwned: jest.fn(),
    };

    const linkGroupProjectServiceMock: Partial<
      jest.Mocked<LinkGroupProjectService>
    > = {
      getProjectRelations: jest.fn(),
      deleteProject: jest.fn(),
    };

    const linkManifestGroupServiceMock: Partial<
      jest.Mocked<LinkManifestGroupService>
    > = {
      removeManifest: jest.fn(),
    };

    const manifestServiceMock: Partial<jest.Mocked<ManifestService>> = {
      findOwnedManifests: jest.fn(),
    };

    const mediaServiceMock: Partial<jest.Mocked<MediaService>> = {
      findOwnedMedia: jest.fn(),
    };

    const linkMediaGroupServiceMock: Partial<
      jest.Mocked<LinkMediaGroupService>
    > = {
      removeMedia: jest.fn(),
    };

    const userGroupServiceMock: Partial<jest.Mocked<UserGroupService>> = {
      findAllOwnedGroups: jest.fn(),
      remove: jest.fn(),
      findUserPersonalGroup: jest.fn(),
    };

    const linkUserGroupRepoMock: Partial<
      jest.Mocked<Repository<LinkUserGroup>>
    > = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserManagementService,
        {
          provide: getRepositoryToken(LinkUserGroup),
          useValue: linkUserGroupRepoMock,
        },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: ProjectService, useValue: projectServiceMock },
        {
          provide: LinkGroupProjectService,
          useValue: linkGroupProjectServiceMock,
        },
        {
          provide: LinkManifestGroupService,
          useValue: linkManifestGroupServiceMock,
        },
        { provide: ManifestService, useValue: manifestServiceMock },
        { provide: MediaService, useValue: mediaServiceMock },
        { provide: LinkMediaGroupService, useValue: linkMediaGroupServiceMock },
        { provide: UserGroupService, useValue: userGroupServiceMock },
      ],
    }).compile();

    service = module.get(UserManagementService);

    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    projectService = module.get(ProjectService) as jest.Mocked<ProjectService>;
    linkGroupProjectService = module.get(
      LinkGroupProjectService,
    ) as jest.Mocked<LinkGroupProjectService>;
    linkManifestGroupService = module.get(
      LinkManifestGroupService,
    ) as jest.Mocked<LinkManifestGroupService>;
    manifestService = module.get(
      ManifestService,
    ) as jest.Mocked<ManifestService>;
    mediaService = module.get(MediaService) as jest.Mocked<MediaService>;
    linkMediaGroupService = module.get(
      LinkMediaGroupService,
    ) as jest.Mocked<LinkMediaGroupService>;
    userGroupService = module.get(
      UserGroupService,
    ) as jest.Mocked<UserGroupService>;
    linkUserGroupRepo = module.get(
      getRepositoryToken(LinkUserGroup),
    ) as jest.Mocked<Repository<LinkUserGroup>>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(linkUserGroupRepo).toBeDefined();
  });

  describe('deleteUserProcess', () => {
    it('deletes owned resources and then user', async () => {
      const userId = 10;

      projectService.findProjectOwned.mockResolvedValue([
        { id: 1 } as any,
        { id: 2 } as any,
      ]);

      linkGroupProjectService.getProjectRelations
        .mockResolvedValueOnce([{ id: 1 } as any]) // project 1: one group -> delete
        .mockResolvedValueOnce([{ id: 1 } as any, { id: 2 } as any]); // project 2: more -> keep

      manifestService.findOwnedManifests.mockResolvedValue([
        { id: 11 } as any,
        { id: 12 } as any,
      ]);

      mediaService.findOwnedMedia.mockResolvedValue([
        { id: 21 } as any,
        { id: 22 } as any,
      ]);

      userGroupService.findAllOwnedGroups.mockResolvedValue([
        { id: 31 } as any,
        { id: 32 } as any,
      ]);

      usersService.deleteUser.mockResolvedValue({ id: userId } as any);

      const result = await service.deleteUserProcess(userId);

      expect(projectService.findProjectOwned).toHaveBeenCalledWith(userId);
      expect(
        linkGroupProjectService.getProjectRelations,
      ).toHaveBeenNthCalledWith(1, 1);
      expect(
        linkGroupProjectService.getProjectRelations,
      ).toHaveBeenNthCalledWith(2, 2);
      expect(linkGroupProjectService.deleteProject).toHaveBeenCalledTimes(1);
      expect(linkGroupProjectService.deleteProject).toHaveBeenCalledWith(1);

      expect(manifestService.findOwnedManifests).toHaveBeenCalledWith(userId);
      expect(linkManifestGroupService.removeManifest).toHaveBeenCalledTimes(2);
      expect(linkManifestGroupService.removeManifest).toHaveBeenCalledWith(11);
      expect(linkManifestGroupService.removeManifest).toHaveBeenCalledWith(12);

      expect(mediaService.findOwnedMedia).toHaveBeenCalledWith(userId);
      expect(linkMediaGroupService.removeMedia).toHaveBeenCalledTimes(2);
      expect(linkMediaGroupService.removeMedia).toHaveBeenCalledWith(21);
      expect(linkMediaGroupService.removeMedia).toHaveBeenCalledWith(22);

      expect(userGroupService.findAllOwnedGroups).toHaveBeenCalledWith(userId);
      expect(userGroupService.remove).toHaveBeenCalledTimes(2);
      expect(userGroupService.remove).toHaveBeenCalledWith(31);
      expect(userGroupService.remove).toHaveBeenCalledWith(32);

      expect(usersService.deleteUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ id: userId });
    });

    it('wraps errors into InternalServerErrorException', async () => {
      projectService.findProjectOwned.mockRejectedValue(new Error('db error'));

      await expect(service.deleteUserProcess(10)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('isUserAllowed', () => {
    it('returns ADMIN when personal group exists and ownerId matches', async () => {
      userGroupService.findUserPersonalGroup.mockResolvedValue({
        id: 1,
        ownerId: 42,
      } as any);

      const rights = await service.isUserAllowed(42);

      expect(userGroupService.findUserPersonalGroup).toHaveBeenCalledWith(42);
      expect(rights).toBe(User_UserGroupRights.ADMIN);
    });

    it('returns undefined when no personal group or ownerId mismatch', async () => {
      userGroupService.findUserPersonalGroup.mockResolvedValue(null as any);

      const rights = await service.isUserAllowed(42);

      expect(userGroupService.findUserPersonalGroup).toHaveBeenCalledWith(42);
      expect(rights).toBeUndefined();
    });
  });

  describe('checkPolicies', () => {
    it('allows READ when rights include READER/EDITOR/ADMIN', async () => {
      jest
        .spyOn(service, 'isUserAllowed')
        .mockResolvedValue(User_UserGroupRights.READER);

      const cb = jest.fn().mockReturnValue('ok');
      const result = await service.checkPolicies(ActionType.READ, 1, cb);

      expect(service.isUserAllowed).toHaveBeenCalledWith(1);
      expect(cb).toHaveBeenCalled();
      expect(result).toBe('ok');
    });

    it('allows UPDATE when rights are ADMIN or EDITOR', async () => {
      jest
        .spyOn(service, 'isUserAllowed')
        .mockResolvedValue(User_UserGroupRights.EDITOR);

      const cb = jest.fn().mockReturnValue('updated');
      const result = await service.checkPolicies(ActionType.UPDATE, 2, cb);

      expect(service.isUserAllowed).toHaveBeenCalledWith(2);
      expect(cb).toHaveBeenCalled();
      expect(result).toBe('updated');
    });

    it('allows DELETE only when ADMIN', async () => {
      jest
        .spyOn(service, 'isUserAllowed')
        .mockResolvedValue(User_UserGroupRights.ADMIN);

      const cb = jest.fn().mockReturnValue('deleted');
      const result = await service.checkPolicies(ActionType.DELETE, 3, cb);

      expect(service.isUserAllowed).toHaveBeenCalledWith(3);
      expect(cb).toHaveBeenCalled();
      expect(result).toBe('deleted');
    });

    it('returns ForbiddenException when user has no rights', async () => {
      jest.spyOn(service, 'isUserAllowed').mockResolvedValue(undefined);

      const cb = jest.fn();
      const result = await service.checkPolicies(ActionType.READ, 4, cb);

      expect(service.isUserAllowed).toHaveBeenCalledWith(4);
      expect(cb).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(ForbiddenException);
    });

    it('returns ForbiddenException when rights not enough for action', async () => {
      jest
        .spyOn(service, 'isUserAllowed')
        .mockResolvedValue(User_UserGroupRights.READER);

      const cb = jest.fn();
      const result = await service.checkPolicies(ActionType.UPDATE, 5, cb);

      expect(service.isUserAllowed).toHaveBeenCalledWith(5);
      expect(cb).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(ForbiddenException);
    });

    it('throws InternalServerErrorException on invalid action', async () => {
      jest
        .spyOn(service, 'isUserAllowed')
        .mockResolvedValue(User_UserGroupRights.ADMIN);

      const cb = jest.fn();

      await expect(
        service.checkPolicies('UNKNOWN_ACTION' as any, 6, cb),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});
