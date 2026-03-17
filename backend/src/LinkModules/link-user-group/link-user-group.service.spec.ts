import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LinkUserGroupService } from './link-user-group.service';
import { LinkUserGroup } from './entities/link-user-group.entity';
import { UserGroupService } from '../../BaseEntities/user-group/user-group.service';
import { UsersService } from '../../BaseEntities/users/users.service';
import { EmailServerService } from '../../utils/email/email.service';
import { LinkMetadataFormatGroupService } from '../link-metadata-format-group/link-metadata-format-group.service';
import { SettingsService } from '../../BaseEntities/setting/setting.service';

describe('LinkUserGroupService', () => {
  let service: LinkUserGroupService;

  let repo: jest.Mocked<Repository<LinkUserGroup>>;
  let userGroupService: jest.Mocked<UserGroupService>;
  let usersService: jest.Mocked<UsersService>;
  let emailService: jest.Mocked<EmailServerService>;
  let linkMetadataFormatGroupService: jest.Mocked<LinkMetadataFormatGroupService>;
  let settingsService: jest.Mocked<SettingsService>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<LinkUserGroup>>> = {
      create: jest.fn(),
      upsert: jest.fn(),
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn() as any,
    };

    const userGroupServiceMock: Partial<jest.Mocked<UserGroupService>> = {
      findOne: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
      findUserPersonalGroup: jest.fn(),
      updateGroup: jest.fn(),
    };

    const usersServiceMock: Partial<jest.Mocked<UsersService>> = {
      findOne: jest.fn(),
      findOneByMail: jest.fn(),
      create: jest.fn(),
      findAllUsers: jest.fn(),
      updateUser: jest.fn(),
      updatePreferredLanguage: jest.fn(),
    };

    const emailServiceMock: Partial<jest.Mocked<EmailServerService>> = {
      sendConfirmationEmail: jest.fn(),
      sendResetPasswordLink: jest.fn() as any,
      sendInternalServerErrorNotification: jest.fn() as any,
      sendMail: jest.fn(),
    };

    const linkMetadataFormatGroupServiceMock: Partial<
      jest.Mocked<LinkMetadataFormatGroupService>
    > = {
      createMetadataFormat: jest.fn(),
      getMetadataFormatForUser: jest.fn(),
    };

    const settingsServiceMock: Partial<jest.Mocked<SettingsService>> = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkUserGroupService,
        {
          provide: getRepositoryToken(LinkUserGroup),
          useValue: repoMock,
        },
        {
          provide: UserGroupService,
          useValue: userGroupServiceMock,
        },
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: EmailServerService,
          useValue: emailServiceMock,
        },
        {
          provide: LinkMetadataFormatGroupService,
          useValue: linkMetadataFormatGroupServiceMock,
        },
        {
          provide: SettingsService,
          useValue: settingsServiceMock, // ✅ FIX
        },
      ],
    }).compile();

    service = module.get(LinkUserGroupService);
    repo = module.get(getRepositoryToken(LinkUserGroup));
    userGroupService = module.get(UserGroupService);
    usersService = module.get(UsersService);
    emailService = module.get(EmailServerService);
    linkMetadataFormatGroupService = module.get(LinkMetadataFormatGroupService);
    settingsService = module.get(SettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
