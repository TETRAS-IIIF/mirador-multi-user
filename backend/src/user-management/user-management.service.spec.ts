import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, InternalServerErrorException, } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

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
import { EmailServerService } from '../utils/email/email.service';

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
  let emailServerService: jest.Mocked<EmailServerService>;

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

    const emailServerServiceMock: Partial<jest.Mocked<EmailServerService>> = {
      sendMail: jest.fn(),
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
        {
          provide: LinkMediaGroupService,
          useValue: linkMediaGroupServiceMock,
        },
        { provide: UserGroupService, useValue: userGroupServiceMock },
        { provide: SettingsService, useValue: settingsServiceMock },
        { provide: EmailServerService, useValue: emailServerServiceMock },
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
    emailServerService = module.get(EmailServerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isUserAllowed', () => {
    it('should return ADMIN if user owns personal group', async () => {
      userGroupService.findUserPersonalGroup.mockResolvedValue({
        ownerId: 1,
      } as any);

      const result = await service.isUserAllowed(1);

      expect(result).toBe(User_UserGroupRights.ADMIN);
    });

    it('should return undefined if user is not owner', async () => {
      userGroupService.findUserPersonalGroup.mockResolvedValue({
        ownerId: 2,
      } as any);

      const result = await service.isUserAllowed(1);

      expect(result).toBeUndefined();
    });
  });

  describe('checkPolicies', () => {
    it('should allow READ for ADMIN', async () => {
      jest
        .spyOn(service, 'isUserAllowed')
        .mockResolvedValue(User_UserGroupRights.ADMIN);

      const callback = jest.fn().mockReturnValue('ok');

      const result = await service.checkPolicies(ActionType.READ, 1, callback);

      expect(result).toBe('ok');
      expect(callback).toHaveBeenCalled();
    });

    it('should forbid if no rights', async () => {
      jest.spyOn(service, 'isUserAllowed').mockResolvedValue(undefined);

      const callback = jest.fn();

      const result = await service.checkPolicies(ActionType.READ, 1, callback);

      expect(result).toBeInstanceOf(ForbiddenException);
    });

    it('should forbid DELETE for non-admin', async () => {
      jest
        .spyOn(service, 'isUserAllowed')
        .mockResolvedValue(User_UserGroupRights.READER);

      const callback = jest.fn();

      const result = await service.checkPolicies(
        ActionType.DELETE,
        1,
        callback,
      );

      expect(result).toBeInstanceOf(ForbiddenException);
    });

    it('should throw on invalid action', async () => {
      jest
        .spyOn(service, 'isUserAllowed')
        .mockResolvedValue(User_UserGroupRights.ADMIN);

      await expect(
        service.checkPolicies('INVALID', 1, jest.fn()),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
