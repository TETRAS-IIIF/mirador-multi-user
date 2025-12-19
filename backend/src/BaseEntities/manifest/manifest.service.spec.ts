import { Test, TestingModule } from '@nestjs/testing';
import { ManifestService } from './manifest.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Manifest } from './entities/manifest.entity';
import { Repository } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';

const mockManifestRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
} as unknown as jest.Mocked<Repository<Manifest>>;

describe('ManifestService', () => {
  let service: ManifestService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManifestService,
        {
          provide: getRepositoryToken(Manifest),
          useValue: mockManifestRepository,
        },
      ],
    }).compile();

    service = module.get<ManifestService>(ManifestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save manifest', async () => {
      const dto = { title: 'm1' } as any;
      const created = { id: 1, ...dto } as any;
      const saved = { id: 1, ...dto } as any;

      mockManifestRepository.create.mockReturnValue(created);
      mockManifestRepository.save.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(mockManifestRepository.create).toHaveBeenCalledWith({ ...dto });
      expect(mockManifestRepository.save).toHaveBeenCalledWith(created);
      expect(result).toBe(saved);
    });

    it('should wrap errors into InternalServerErrorException', async () => {
      const dto = { title: 'm1' } as any;
      mockManifestRepository.create.mockImplementation(() => {
        throw new Error('boom');
      });

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('should return manifest by id', async () => {
      const manifest = { id: 1, title: 'm1' } as any;
      mockManifestRepository.findOneBy.mockResolvedValue(manifest);

      const result = await service.findOne(1);

      expect(mockManifestRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
      });
      expect(result).toBe(manifest);
    });

    it('should wrap errors into InternalServerErrorException', async () => {
      mockManifestRepository.findOneBy.mockRejectedValue(new Error('boom'));

      await expect(service.findOne(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('update', () => {
    it('should update and return manifest when affected = 1', async () => {
      const dto = { title: 'updated' } as any;
      const manifest = { id: 1, title: 'updated' } as any;

      mockManifestRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockManifestRepository.findOneBy.mockResolvedValue(manifest);

      const result = await service.update(1, dto);

      expect(mockManifestRepository.update).toHaveBeenCalledWith(1, dto);
      expect(mockManifestRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toBe(manifest);
    });

    it('should wrap not found into InternalServerErrorException when affected != 1', async () => {
      mockManifestRepository.update.mockResolvedValue({ affected: 0 } as any);

      await expect(
        service.update(1, { title: 'x' } as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('should wrap errors into InternalServerErrorException', async () => {
      mockManifestRepository.update.mockRejectedValue(new Error('boom'));

      await expect(
        service.update(1, { title: 'x' } as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    it('should delete manifest when affected = 1', async () => {
      mockManifestRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove(1);

      expect(mockManifestRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should wrap not found into InternalServerErrorException when affected != 1', async () => {
      mockManifestRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.remove(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    it('should wrap errors into InternalServerErrorException', async () => {
      mockManifestRepository.delete.mockRejectedValue(new Error('boom'));

      await expect(service.remove(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('findOwnedManifests', () => {
    it('should return manifests for given userId', async () => {
      const userId = 42;
      const manifests = [{ id: 1, idCreator: userId }] as any;

      mockManifestRepository.find.mockResolvedValue(manifests);

      const result = await service.findOwnedManifests(userId);

      expect(mockManifestRepository.find).toHaveBeenCalledWith({
        where: { idCreator: userId },
      });
      expect(result).toBe(manifests);
    });

    it('should wrap errors into InternalServerErrorException', async () => {
      mockManifestRepository.find.mockRejectedValue(new Error('boom'));

      await expect(service.findOwnedManifests(42)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('findManifestsByPartialStringAndUserGroup', () => {
    it('should build query and return manifests', async () => {
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1 }] as any),
      };

      (mockManifestRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        qb,
      );

      const result = await service.findManifestsByPartialStringAndUserGroup(
        'par',
        5,
      );

      expect(mockManifestRepository.createQueryBuilder).toHaveBeenCalledWith(
        'manifest',
      );
      expect(qb.innerJoin).toHaveBeenCalledWith(
        'manifest.linkManifestGroup',
        'linkManifestGroup',
      );
      expect(qb.innerJoin).toHaveBeenCalledWith(
        'linkManifestGroup.user_group',
        'userGroup',
      );
      expect(qb.where).toHaveBeenCalledWith('userGroup.id = :id', {
        id: 5,
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'LEFT(manifest.title, :length) = :partialString',
        {
          length: 3,
          partialString: 'par',
        },
      );
      expect(qb.distinct).toHaveBeenCalledWith(true);
      expect(qb.limit).toHaveBeenCalledWith(3);
      expect(result).toEqual([{ id: 1 }]);
    });

    it('should wrap errors into InternalServerErrorException', async () => {
      (
        mockManifestRepository.createQueryBuilder as jest.Mock
      ).mockImplementation(() => {
        throw new Error('boom');
      });

      await expect(
        service.findManifestsByPartialStringAndUserGroup('par', 5),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});
