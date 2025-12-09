import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MediaService } from './media.service';
import { Media } from './entities/media.entity';

describe('MediaService', () => {
  let service: MediaService;
  let repo: jest.Mocked<Repository<Media>>;
  let qb: any;

  beforeEach(async () => {
    // Minimal query builder mock
    qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    const repoMock: any = {
      create: jest.fn((entity: any) => entity),
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => qb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: getRepositoryToken(Media),
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get(MediaService);
    repo = module.get(getRepositoryToken(Media));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create() sets metadata.creator from user_group.title and saves media', async () => {
    const dto: any = {
      title: 'foo',
      description: 'bar',
      user_group: { title: 'My Group' },
    };

    const saved = { id: 1, ...dto } as Media;
    repo.save.mockResolvedValue(saved);

    const result = await service.create(dto);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'foo',
        description: 'bar',
        metadata: { creator: 'My Group' },
      }),
    );
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'foo',
        description: 'bar',
        metadata: { creator: 'My Group' },
      }),
    );
    expect(result).toBe(saved);
  });

  it('findMediasByPartialStringAndUserGroup() builds query with LEFT and limit(3)', async () => {
    const medias = [{ id: 1 } as Media];
    qb.getMany.mockResolvedValue(medias);

    const partial = 'Demo';
    const userGroupId = 42;

    const result = await service.findMediasByPartialStringAndUserGroup(
      partial,
      userGroupId,
    );

    expect(repo.createQueryBuilder).toHaveBeenCalledWith('media');
    expect(qb.innerJoin).toHaveBeenCalledWith(
      'media.linkMediaGroup',
      'linkMediaGroup',
    );
    expect(qb.innerJoin).toHaveBeenCalledWith(
      'linkMediaGroup.user_group',
      'userGroup',
    );
    expect(qb.where).toHaveBeenCalledWith('userGroup.id = :id', {
      id: userGroupId,
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'LEFT(media.title, :length) = :partialString',
      {
        length: partial.length,
        partialString: partial,
      },
    );
    expect(qb.distinct).toHaveBeenCalledWith(true);
    expect(qb.limit).toHaveBeenCalledWith(3);
    expect(qb.getMany).toHaveBeenCalled();
    expect(result).toBe(medias);
  });
});
