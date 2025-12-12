import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LinkMediaGroupService } from './link-media-group.service';
import { LinkMediaGroup } from './entities/link-media-group.entity';
import { UserGroupService } from '../../BaseEntities/user-group/user-group.service';
import { LinkUserGroupService } from '../link-user-group/link-user-group.service';
import { MediaService } from '../../BaseEntities/media/media.service';

describe('LinkMediaGroupService', () => {
  let service: LinkMediaGroupService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let repo: jest.Mocked<Repository<LinkMediaGroup>>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<LinkMediaGroup>>> = {
      create: jest.fn(),
      upsert: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const userGroupServiceMock: Partial<jest.Mocked<UserGroupService>> = {
      findUserGroupById: jest.fn(),
      findUserPersonalGroup: jest.fn(),
    };

    const linkUserGroupServiceMock: Partial<jest.Mocked<LinkUserGroupService>> =
      {
        findALlGroupsForUser: jest.fn(),
      };

    const mediaServiceMock: Partial<jest.Mocked<MediaService>> = {
      create: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkMediaGroupService,
        {
          provide: getRepositoryToken(LinkMediaGroup),
          useValue: repoMock,
        },
        {
          provide: UserGroupService,
          useValue: userGroupServiceMock,
        },
        {
          provide: LinkUserGroupService,
          useValue: linkUserGroupServiceMock,
        },
        {
          provide: MediaService,
          useValue: mediaServiceMock,
        },
      ],
    }).compile();

    service = module.get<LinkMediaGroupService>(LinkMediaGroupService);
    repo = module.get(getRepositoryToken(LinkMediaGroup)) as jest.Mocked<
      Repository<LinkMediaGroup>
    >;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
