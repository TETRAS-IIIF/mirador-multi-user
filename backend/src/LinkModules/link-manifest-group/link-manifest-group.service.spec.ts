import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';

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
      find: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    };

    const manifestServiceMock: Partial<jest.Mocked<ManifestService>> = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const userGroupServiceMock: Partial<jest.Mocked<UserGroupService>> = {
      findOne: jest.fn(),
      findUserPersonalGroup: jest.fn(),
    };

    const linkUserGroupServiceMock: Partial<jest.Mocked<LinkUserGroupService>> =
      {
        findALlGroupsForUser: jest.fn(),
      };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkManifestGroupService,
        { provide: getRepositoryToken(LinkManifestGroup), useValue: repoMock },
        { provide: ManifestService, useValue: manifestServiceMock },
        { provide: UserGroupService, useValue: userGroupServiceMock },
        { provide: LinkUserGroupService, useValue: linkUserGroupServiceMock },
      ],
    }).compile();

    service = module.get<LinkManifestGroupService>(LinkManifestGroupService);
    repo = module.get(getRepositoryToken(LinkManifestGroup));
    manifestService = module.get(ManifestService);
    userGroupService = module.get(UserGroupService);
    linkUserGroupService = module.get(LinkUserGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('removeManifestGroupRelation throws InternalServerErrorException when nothing deleted', async () => {
    (repo.delete as jest.Mock).mockResolvedValue({ affected: 0 } as any);

    await expect(
      service.removeManifestGroupRelation(1, 2),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('removeManifestGroupRelation returns delete result when one row deleted', async () => {
    const deleteResult = { affected: 1 };
    (repo.delete as jest.Mock).mockResolvedValue(deleteResult as any);

    const result = await service.removeManifestGroupRelation(1, 2);

    expect(repo.delete).toHaveBeenCalledWith({
      manifest: { id: 1 },
      user_group: { id: 2 },
    });
    expect(result).toBe(deleteResult);
  });

  it('removeManifestGroupRelation wraps repository errors in InternalServerErrorException', async () => {
    (repo.delete as jest.Mock).mockRejectedValue(new Error('DB error'));

    await expect(
      service.removeManifestGroupRelation(1, 2),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
