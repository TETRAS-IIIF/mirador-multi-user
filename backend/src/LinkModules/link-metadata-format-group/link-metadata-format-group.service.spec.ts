import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';

import { LinkMetadataFormatGroupService } from './link-metadata-format-group.service';
import { LinkMetadataFormatGroup } from './entities/link-metadata-format-group.entity';
import { MetadataFormatService } from '../../BaseEntities/metadata-format/metadata-format.service';
import { UserGroupService } from '../../BaseEntities/user-group/user-group.service';
import { MetadataFormat } from '../../BaseEntities/metadata-format/entities/metadata-format.entity';
import { UserGroup } from '../../BaseEntities/user-group/entities/user-group.entity';
import { CreateLinkMetadataFormatGroupDto } from './dto/create-link-metadata-format-group.dto';

describe('LinkMetadataFormatGroupService', () => {
  let service: LinkMetadataFormatGroupService;
  let repo: jest.Mocked<Repository<LinkMetadataFormatGroup>>;
  let metadataFormatService: jest.Mocked<MetadataFormatService>;
  let userGroupService: jest.Mocked<UserGroupService>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<LinkMetadataFormatGroup>>> =
      {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        createQueryBuilder: jest.fn(),
      };

    const metadataFormatServiceMock: Partial<
      jest.Mocked<MetadataFormatService>
    > = {
      create: jest.fn(),
    };

    const userGroupServiceMock: Partial<jest.Mocked<UserGroupService>> = {
      findUserPersonalGroup: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkMetadataFormatGroupService,
        {
          provide: getRepositoryToken(LinkMetadataFormatGroup),
          useValue: repoMock,
        },
        {
          provide: MetadataFormatService,
          useValue: metadataFormatServiceMock,
        },
        {
          provide: UserGroupService,
          useValue: userGroupServiceMock,
        },
      ],
    }).compile();

    service = module.get(LinkMetadataFormatGroupService);
    repo = module.get(getRepositoryToken(LinkMetadataFormatGroup));
    metadataFormatService = module.get(
      MetadataFormatService,
    ) as jest.Mocked<MetadataFormatService>;
    userGroupService = module.get(
      UserGroupService,
    ) as jest.Mocked<UserGroupService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create() should call repository.create and save with metadataFormat + user_group', async () => {
    const metadataFormat = { id: 1, title: 'fmt' } as MetadataFormat;
    const userGroup = { id: 2, ownerId: 10 } as UserGroup;
    const createdEntity = { id: 123 } as LinkMetadataFormatGroup;

    repo.create.mockReturnValue(createdEntity);
    repo.save.mockResolvedValue(createdEntity);

    const result = await service.create(metadataFormat, userGroup);

    expect(repo.create).toHaveBeenCalledWith({
      metadataFormat,
      user_group: userGroup,
    });
    expect(repo.save).toHaveBeenCalledWith(createdEntity);
    expect(result).toBe(createdEntity);
  });

  it('getMetadataFormatForUser() should map to metadataFormat array', async () => {
    const userId = 10;

    const link1 = {
      metadataFormat: { id: 1, title: 'fmt1' },
    } as LinkMetadataFormatGroup;
    const link2 = {
      metadataFormat: { id: 2, title: 'fmt2' },
    } as LinkMetadataFormatGroup;

    repo.find.mockResolvedValue([link1, link2]);

    const result = await service.getMetadataFormatForUser(userId);

    expect(repo.find).toHaveBeenCalledWith({
      where: {
        user_group: {
          ownerId: userId,
        },
      },
    });
    expect(result).toEqual([
      { id: 1, title: 'fmt1' },
      { id: 2, title: 'fmt2' },
    ]);
  });

  it('createMetadataFormat() uses userGroupService + metadataFormatService and returns link', async () => {
    const dto: CreateLinkMetadataFormatGroupDto = {
      title: 'My format',
      creatorId: 42,
      // add any other required dto fields here
    } as any;

    const userGroup = { id: 2, ownerId: 42 } as UserGroup;
    const metadataFormat = { id: 1, title: 'My format' } as MetadataFormat;
    const linkEntity = { id: 10 } as LinkMetadataFormatGroup;

    userGroupService.findUserPersonalGroup.mockResolvedValue(userGroup);
    metadataFormatService.create.mockResolvedValue(metadataFormat);
    repo.create.mockReturnValue(linkEntity);
    repo.save.mockResolvedValue(linkEntity);

    const result = await service.createMetadataFormat(dto);

    expect(userGroupService.findUserPersonalGroup).toHaveBeenCalledWith(
      dto.creatorId,
    );
    expect(metadataFormatService.create).toHaveBeenCalledWith(dto);
    expect(repo.create).toHaveBeenCalledWith({
      metadataFormat,
      user_group: userGroup,
    });
    expect(repo.save).toHaveBeenCalledWith(linkEntity);
    expect(result).toBe(linkEntity);
  });

  it('createMetadataFormat() maps 409 error to ConflictException', async () => {
    const dto: CreateLinkMetadataFormatGroupDto = {
      title: 'Duplicate',
      creatorId: 42,
    } as any;

    userGroupService.findUserPersonalGroup.mockResolvedValue({
      id: 2,
      ownerId: 42,
    } as UserGroup);
    metadataFormatService.create.mockRejectedValue({ status: 409 } as any);

    await expect(service.createMetadataFormat(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
