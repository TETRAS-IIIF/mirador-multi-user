import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../BaseEntities/project/entities/project.entity';
import { ProjectService } from '../BaseEntities/project/project.service';
import { LinkGroupProject } from '../LinkModules/link-group-project/entities/link-group-project.entity';

describe('ProjectService (unit)', () => {
  let service: ProjectService;
  let projectRepo: jest.Mocked<Repository<Project>>;

  beforeEach(async () => {
    const projectRepoMock: Partial<jest.Mocked<Repository<Project>>> = {
      createQueryBuilder: jest.fn(),
      // add other methods if ProjectService uses them (findOne, save, etc.)
    };

    const linkGroupProjectRepoMock: Partial<
      jest.Mocked<Repository<LinkGroupProject>>
    > = {
      // fill if ProjectService directly uses this repo
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(Project),
          useValue: projectRepoMock,
        },
        {
          provide: getRepositoryToken(LinkGroupProject),
          useValue: linkGroupProjectRepoMock,
        },
        // add other dependencies of ProjectService here as mocks (if it injects other services)
      ],
    }).compile();

    service = module.get(ProjectService);
    projectRepo = module.get(getRepositoryToken(Project)) as jest.Mocked<
      Repository<Project>
    >;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findProjectsByPartialNameAndUserGroup', () => {
    it('returns only projects whose title starts with given partial and are linked to the user group', async () => {
      const partial = 'Demo';
      const userGroupId = 123;

      const projectMatched: Project = {
        id: 1,
        title: 'Demo Project A',
      } as any;

      const qb: any = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      (projectRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      qb.getMany.mockResolvedValue([projectMatched]);

      const result = await service.findProjectsByPartialNameAndUserGroup(
        partial,
        userGroupId,
      );

      expect(projectRepo.createQueryBuilder).toHaveBeenCalledWith('project');
      expect(qb.getMany).toHaveBeenCalled();

      expect(result).toEqual([projectMatched]);
    });
  });
});
