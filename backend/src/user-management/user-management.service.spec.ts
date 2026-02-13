import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Issuer } from 'openid-client';
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
import { SettingsService } from '../BaseEntities/setting/setting.service';
import { ActionType } from '../enum/actions';
import { User_UserGroupRights } from '../enum/rights';

jest.mock('openid-client');

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
  let settingsService: jest.Mocked<SettingsService>;

  // Mock for global fetch
  const mockFetch = jest.fn();
  global.fetch = mockFetch as any;

  beforeEach(async () => {
    process.env.OIDC_ISSUER = 'http://localhost/realms/test';
    process.env.OIDC_CLIENT_ID = 'admin-cli';
    process.env.OIDC_CLIENT_SECRET = 'secret';

    const usersServiceMock: Partial<jest.Mocked<UsersService>> = {
      findOne: jest.fn(),
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

    const settingsServiceMock: Partial<jest.Mocked<SettingsService>> = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserManagementService,
        {
          provide: getRepositoryToken(LinkUserGroup),
          useValue: {},
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
        { provide: SettingsService, useValue: settingsServiceMock },
      ],
    }).compile();

    service = module.get<UserManagementService>(UserManagementService);
    usersService = module.get(UsersService);
    projectService = module.get(ProjectService);
    linkGroupProjectService = module.get(LinkGroupProjectService);
    linkManifestGroupService = module.get(LinkManifestGroupService);
    manifestService = module.get(ManifestService);
    mediaService = module.get(MediaService);
    linkMediaGroupService = module.get(LinkMediaGroupService);
    userGroupService = module.get(UserGroupService);
    settingsService = module.get(SettingsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteUserProcess', () => {
    const userId = 10;
    const mockUser = { id: userId, mail: 'test@example.com' };

    beforeEach(() => {
      usersService.findOne.mockResolvedValue(mockUser as any);
      projectService.findProjectOwned.mockResolvedValue([]);
      manifestService.findOwnedManifests.mockResolvedValue([]);
      mediaService.findOwnedMedia.mockResolvedValue([]);
      userGroupService.findAllOwnedGroups.mockResolvedValue([]);

      settingsService.get.mockResolvedValue(false as any);

      usersService.deleteUser.mockResolvedValue({ id: userId } as any);
    });

    it('deletes owned resources and then user (without OIDC)', async () => {
      projectService.findProjectOwned.mockResolvedValue([{ id: 1 } as any]);
      linkGroupProjectService.getProjectRelations.mockResolvedValue([
        { groupId: 100 } as any,
      ]);

      const result = await service.deleteUserProcess(userId);

      expect(usersService.findOne).toHaveBeenCalledWith(userId);
      expect(projectService.findProjectOwned).toHaveBeenCalledWith(userId);
      expect(linkGroupProjectService.deleteProject).toHaveBeenCalledWith(1);
      expect(usersService.deleteUser).toHaveBeenCalledWith(userId);
      expect(settingsService.get).toHaveBeenCalled();
      expect(result).toEqual({ id: userId });
    });

    it('attempts to delete OIDC account if setting is enabled', async () => {
      settingsService.get.mockResolvedValue(true as any);

      const mockGrant = jest
        .fn()
        .mockResolvedValue({ access_token: 'fake-token' });
      const mockClient = jest.fn().mockImplementation(() => ({
        grant: mockGrant,
      }));
      (Issuer.discover as jest.Mock).mockResolvedValue({
        issuer: 'http://localhost/realms/test',
        Client: mockClient,
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 'oidc-uuid-123' }],
        })
        .mockResolvedValueOnce({
          status: 204,
          ok: true,
        });

      await service.deleteUserProcess(userId);

      expect(Issuer.discover).toHaveBeenCalledWith(
        'http://localhost/realms/test',
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          '/admin/realms/test/users?email=test%40example.com',
        ),
        expect.any(Object),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/realms/test/users/oidc-uuid-123'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('wraps errors into InternalServerErrorException', async () => {
      usersService.findOne.mockRejectedValue(new Error('db error'));

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
      expect(rights).toBe(User_UserGroupRights.ADMIN);
    });
  });

  describe('checkPolicies', () => {
    it('allows READ when rights include READER', async () => {
      jest
        .spyOn(service, 'isUserAllowed')
        .mockResolvedValue(User_UserGroupRights.READER);
      const cb = jest.fn().mockReturnValue('ok');

      const result = await service.checkPolicies(ActionType.READ, 1, cb);
      expect(cb).toHaveBeenCalled();
      expect(result).toBe('ok');
    });

    it('returns ForbiddenException when user has no rights', async () => {
      jest.spyOn(service, 'isUserAllowed').mockResolvedValue(undefined);
      const cb = jest.fn();

      const result = await service.checkPolicies(ActionType.READ, 4, cb);
      expect(result).toBeInstanceOf(ForbiddenException);
    });
  });
});
