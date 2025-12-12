import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LinkManifestGroupService } from './link-manifest-group.service';
import { LinkManifestGroup } from './entities/link-manifest-group.entity';
import { ManifestService } from '../../BaseEntities/manifest/manifest.service';
import { UserGroupService } from '../../BaseEntities/user-group/user-group.service';
import { LinkUserGroupService } from '../link-user-group/link-user-group.service';

describe('LinkManifestGroupService', () => {
  let service: LinkManifestGroupService;

  let repo: jest.Mocked<Repository<LinkManifestGroup>>;
  let manifestService: jest.Mocked<ManifestService>;
  let userGroupService: jest.Mocked<UserGroupService>;
  let linkUserGroupService: jest.Mocked<LinkUserGroupService>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<LinkManifestGroup>>> = {
      create: jest.fn(),
      upsert: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn() as any,
    };

    const manifestServiceMock: Partial<jest.Mocked<ManifestService>> = {
      // extend as you add tests that call real methods
      create: jest.fn() as any,
      findOne: jest.fn() as any,
      update: jest.fn() as any,
      remove: jest.fn() as any,
    };

    const userGroupServiceMock: Partial<jest.Mocked<UserGroupService>> = {
      findOne: jest.fn(),
      findUserPersonalGroup: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };

    const linkUserGroupServiceMock: Partial<jest.Mocked<LinkUserGroupService>> =
      {
        findALlGroupsForUser: jest.fn(),
        findUserPersonalGroup: jest.fn() as any,
        checkPolicies: jest.fn() as any,
      };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkManifestGroupService,
        {
          provide: getRepositoryToken(LinkManifestGroup),
          useValue: repoMock,
        },
        {
          provide: ManifestService,
          useValue: manifestServiceMock,
        },
        {
          provide: UserGroupService,
          useValue: userGroupServiceMock,
        },
        {
          provide: LinkUserGroupService,
          useValue: linkUserGroupServiceMock,
        },
      ],
    }).compile();

    service = module.get(LinkManifestGroupService);
    repo = module.get(getRepositoryToken(LinkManifestGroup));
    manifestService = module.get(ManifestService);
    userGroupService = module.get(UserGroupService);
    linkUserGroupService = module.get(LinkUserGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
