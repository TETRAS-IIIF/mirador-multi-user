import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { ProjectService } from './project.service';
import { Project } from './entities/project.entity';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

describe('ProjectService', () => {
  let service: ProjectService;
  let repo: jest.Mocked<Repository<Project>>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<Project>>> = {
      save: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(Project),
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get(ProjectService);
    repo = module.get(getRepositoryToken(Project));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create() fills default description and calls save', async () => {
    const dto: any = {
      title: 'My project',
      ownerId: 1,
      description: undefined,
    };

    const saved = {
      id: 1,
      ...dto,
      description: 'Your project description here',
    } as Project;
    repo.save.mockResolvedValue(saved);

    const result = await service.create(dto);

    expect(repo.save).toHaveBeenCalledWith({
      ...dto,
      description: 'Your project description here',
    });
    expect(result).toBe(saved);
  });

  it('create() wraps repository errors', async () => {
    repo.save.mockRejectedValue(new Error('db error'));

    await expect(
      service.create({ title: 'x', ownerId: 1 } as any),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('findOne() returns project from repo', async () => {
    const proj = { id: 10 } as Project;
    repo.findOneBy.mockResolvedValue(proj);

    const result = await service.findOne(10);

    expect(repo.findOneBy).toHaveBeenCalledWith({ id: 10 });
    expect(result).toBe(proj);
  });

  it('update() throws NotFound when project does not exist', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(
      service.update(123, { title: 'new title' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update() filters lock fields and saves project', async () => {
    const existing = {
      id: 5,
      title: 'Old',
      lockedAt: null,
      lockedByUserId: null,
      description: 'desc',
    } as any;

    repo.findOne.mockResolvedValue(existing);
    repo.save.mockImplementation(async (p: any) => p);
    repo.findOneBy = jest.fn().mockResolvedValue({ ...existing, title: 'New' });

    const dto: any = {
      id: 999, // should be ignored
      title: 'New',
      lockedAt: new Date(),
      lockedByUserId: 42,
    };

    const result = await service.update(5, dto);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 5,
        title: 'New',
      }),
    );
    // lock fields must NOT be overridden from dto
    const savedArg = (repo.save as jest.Mock).mock.calls[0][0];
    expect(savedArg.lockedAt).toBe(existing.lockedAt);
    expect(savedArg.lockedByUserId).toBe(existing.lockedByUserId);

    expect(result.title).toBe('New');
  });

  it('remove() calls delete and throws NotFound when affected != 1', async () => {
    repo.delete.mockResolvedValue({ affected: 0 } as DeleteResult);

    await expect(service.remove(9)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove() returns DeleteResult when delete succeeds', async () => {
    const res = { affected: 1 } as DeleteResult;
    repo.delete.mockResolvedValue(res);

    const result = await service.remove(9);

    expect(repo.delete).toHaveBeenCalledWith(9);
    expect(result).toBe(res);
  });

  it('findProjectOwned() filters by ownerId and loads relations', async () => {
    const list = [{ id: 1 }] as Project[];
    repo.find.mockResolvedValue(list);

    const result = await service.findProjectOwned(7);

    expect(repo.find).toHaveBeenCalledWith({
      where: { ownerId: 7 },
      relations: ['linkGroupProjectsIds'],
    });
    expect(result).toBe(list);
  });

  it('lockProject(true) updates lock with userId', async () => {
    repo.update.mockResolvedValue({} as any);

    await service.lockProject(1, true, 42);

    expect(repo.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        lockedByUserId: 42,
      }),
    );
  });

  it('lockProject(false) clears lock fields', async () => {
    repo.update.mockResolvedValue({} as any);

    await service.lockProject(1, false, 42);

    expect(repo.update).toHaveBeenCalledWith(1, {
      lockedAt: null,
      lockedByUserId: null,
    });
  });

  it('findProjectsByPartialNameAndUserGroup() builds the right query', async () => {
    const qb: any = {
      select: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 1, title: 'Demo Project' }]),
    };

    // Brackets is just passed into andWhere, no need to test its internals here
    (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

    const res = await service.findProjectsByPartialNameAndUserGroup('Demo', 3);

    expect(repo.createQueryBuilder).toHaveBeenCalledWith('project');
    expect(qb.select).toHaveBeenCalledWith(['project.id', 'project.title']);
    expect(qb.innerJoin).toHaveBeenCalledWith(
      'project.linkGroupProjectsIds',
      'linkGroupProject',
    );
    expect(qb.innerJoin).toHaveBeenCalledWith(
      'linkGroupProject.user_group',
      'userGroup',
    );
    expect(qb.where).toHaveBeenCalledWith('userGroup.id = :id', { id: 3 });
    expect(qb.distinct).toHaveBeenCalledWith(true);
    expect(qb.limit).toHaveBeenCalledWith(3);
    expect(res).toEqual([{ id: 1, title: 'Demo Project' }]);
  });
});
