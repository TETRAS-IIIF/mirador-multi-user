import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SnapshotService } from './snapshot.service';
import { Snapshot } from './entities/snapshot.entity';
import { InternalServerErrorException } from '@nestjs/common';

describe('SnapshotService', () => {
  let service: SnapshotService;
  let repo: jest.Mocked<Repository<Snapshot>>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<Snapshot>>> = {
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnapshotService,
        {
          provide: getRepositoryToken(Snapshot),
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get(SnapshotService);
    repo = module.get(getRepositoryToken(Snapshot));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('createSnapshot() passes projectId as nested project object', async () => {
    const dto = {
      title: 'snap',
      description: 'desc',
      projectId: 10,
    } as any;

    const saved = { id: 1, ...dto } as Snapshot;
    repo.save.mockResolvedValue(saved);

    const result = await service.createSnapshot(dto);

    expect(repo.save).toHaveBeenCalledWith({
      ...dto,
      project: { id: dto.projectId },
    });
    expect(result).toBe(saved);
  });

  it('createSnapshot() wraps errors in InternalServerErrorException', async () => {
    repo.save.mockRejectedValue(new Error('db error'));

    await expect(
      service.createSnapshot({ projectId: 1 } as any),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('findOne() delegates to repository', async () => {
    const snap = { id: 5 } as Snapshot;
    repo.findOne.mockResolvedValue(snap);

    const result = await service.findOne(5);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(result).toBe(snap);
  });

  it('updateSnapshot() calls update then findOne', async () => {
    repo.update.mockResolvedValue({} as any);
    const snap = { id: 7 } as Snapshot;
    repo.findOne.mockResolvedValue(snap);

    const result = await service.updateSnapshot(7, snap);

    expect(repo.update).toHaveBeenCalledWith(7, snap);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 7 } });
    expect(result).toBe(snap);
  });

  it('deleteSnapshot() calls delete', async () => {
    repo.delete.mockResolvedValue({} as any);

    await service.deleteSnapshot(3);

    expect(repo.delete).toHaveBeenCalledWith(3);
  });

  it('findAllProjectSnapshot() filters by project id', async () => {
    const snaps = [{ id: 1 }, { id: 2 }] as Snapshot[];
    repo.find.mockResolvedValue(snaps);

    const result = await service.findAllProjectSnapshot(9);

    expect(repo.find).toHaveBeenCalledWith({
      where: { project: { id: 9 } },
    });
    expect(result).toBe(snaps);
  });
});
