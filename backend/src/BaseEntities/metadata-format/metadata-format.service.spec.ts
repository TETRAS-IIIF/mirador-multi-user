import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

import { MetadataFormatService } from './metadata-format.service';
import { MetadataFormat } from './entities/metadata-format.entity';
import { CreateMetadataFormatDto } from './dto/create-metadata-format.dto';

describe('MetadataFormatService', () => {
  let service: MetadataFormatService;
  let repo: jest.Mocked<Repository<MetadataFormat>>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<MetadataFormat>>> = {
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetadataFormatService,
        {
          provide: getRepositoryToken(MetadataFormat),
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get(MetadataFormatService);
    repo = module.get(getRepositoryToken(MetadataFormat)) as jest.Mocked<
      Repository<MetadataFormat>
    >;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('saves metadata format and returns it on success', async () => {
      const dto: CreateMetadataFormatDto = {
        title: 'My format',
        creatorId: 42,
      } as any;

      const saved = { id: 1, ...dto } as MetadataFormat;
      repo.save.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(repo.save).toHaveBeenCalledWith(dto);
      expect(result).toBe(saved);
    });

    it('throws ConflictException when DB error code is ER_DUP_ENTRY', async () => {
      const dto: CreateMetadataFormatDto = {
        title: 'Duplicate',
        creatorId: 42,
      } as any;

      const err: any = new Error('Duplicate');
      err.code = 'ER_DUP_ENTRY';
      repo.save.mockRejectedValue(err);

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws InternalServerErrorException on other errors', async () => {
      const dto: CreateMetadataFormatDto = {
        title: 'Other error',
        creatorId: 42,
      } as any;

      const err: any = new Error('Some DB error');
      err.code = 'SOME_OTHER_CODE';
      repo.save.mockRejectedValue(err);

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('findAllMetadataFormatsForUser', () => {
    it('returns formats for userId', async () => {
      const userId = 10;

      const formats = [
        { id: 1, title: 'fmt1', creatorId: userId },
        { id: 2, title: 'fmt2', creatorId: userId },
      ] as any;

      repo.find.mockResolvedValue(formats);

      const result = await service.findAllMetadataFormatsForUser(userId);

      expect(repo.find).toHaveBeenCalledWith({
        where: { creatorId: userId },
      });
      expect(result).toBe(formats);
    });

    it('throws InternalServerErrorException if repository throws', async () => {
      const userId = 10;

      repo.find.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(
        service.findAllMetadataFormatsForUser(userId),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});
