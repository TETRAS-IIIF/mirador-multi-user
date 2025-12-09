import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { AnnotationPageService } from './annotation-page.service';
import { AnnotationPage } from './entities/annotation-page.entity';
import { CreateAnnotationPageDto } from './dto/create-annotation-page.dto';

describe('AnnotationPageService', () => {
  let service: AnnotationPageService;
  let repo: jest.Mocked<Repository<AnnotationPage>>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<AnnotationPage>>> = {
      create: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnotationPageService,
        {
          provide: getRepositoryToken(AnnotationPage),
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get(AnnotationPageService);
    repo = module.get(getRepositoryToken(AnnotationPage)) as jest.Mocked<
      Repository<AnnotationPage>
    >;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deletes existing and saves new annotationPage then returns findAll', async () => {
      const dto: CreateAnnotationPageDto = {
        annotationPageId: 'page-1',
        projectId: 123,
        // add any other required fields
      } as any;

      const created = { ...dto, id: 1 } as AnnotationPage;
      const found = [{ id: 1, ...dto }] as AnnotationPage[];

      repo.create.mockReturnValue(created);
      repo.delete.mockResolvedValue({ affected: 1 } as DeleteResult);
      repo.save.mockResolvedValue(created);
      // findAll calls repo.find internally
      repo.find.mockResolvedValue(found);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.delete).toHaveBeenCalledWith({
        annotationPageId: created.annotationPageId,
        projectId: created.projectId,
      });
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(repo.find).toHaveBeenCalledWith({
        where: {
          annotationPageId: created.annotationPageId,
          projectId: created.projectId,
        },
      });
      expect(result).toBe(found);
    });

    it('wraps errors in InternalServerErrorException', async () => {
      const dto: CreateAnnotationPageDto = {
        annotationPageId: 'page-1',
        projectId: 123,
      } as any;

      repo.create.mockImplementation(() => {
        throw new Error('boom');
      });

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('findAllProjectAnnotation', () => {
    it('returns array from repository', async () => {
      const projectId = 10;
      const pages = [
        { id: 1, projectId },
        { id: 2, projectId },
      ] as any;
      repo.find.mockResolvedValue(pages);

      const result = await service.findAllProjectAnnotation(projectId);

      expect(repo.find).toHaveBeenCalledWith({
        where: { projectId },
      });
      expect(result).toBe(pages);
    });

    it('throws InternalServerErrorException on error', async () => {
      repo.find.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(service.findAllProjectAnnotation(10)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('returns matching pages', async () => {
      const annotPageId = 'page-1';
      const projectId = 5;
      const pages = [{ id: 1 }] as any;
      repo.find.mockResolvedValue(pages);

      const result = await service.findAll(annotPageId, projectId);

      expect(repo.find).toHaveBeenCalledWith({
        where: { annotationPageId: annotPageId, projectId },
      });
      expect(result).toBe(pages);
    });

    it('throws InternalServerErrorException on error', async () => {
      repo.find.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(service.findAll('page-1', 5)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('returns single page', async () => {
      const annotPageId = 'page-1';
      const projectId = 5;
      const page = { id: 1 } as any;
      repo.findOne.mockResolvedValue(page);

      const result = await service.findOne(annotPageId, projectId);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { annotationPageId: annotPageId, projectId },
      });
      expect(result).toBe(page);
    });

    it('throws InternalServerErrorException on error', async () => {
      repo.findOne.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(service.findOne('page-1', 5)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteAnnotationPage', () => {
    it('returns delete result when affected > 0', async () => {
      const annotPageId = 'page-1';
      const projectId = 5;
      const deleteResult = { affected: 1 } as DeleteResult;

      repo.delete.mockResolvedValue(deleteResult);

      const result = await service.deleteAnnotationPage(annotPageId, projectId);

      expect(repo.delete).toHaveBeenCalledWith({
        annotationPageId: annotPageId,
        projectId,
      });
      expect(result).toBe(deleteResult);
    });

    it('returns NotFoundException instance when affected === 0', async () => {
      const annotPageId = 'page-1';
      const projectId = 5;
      const deleteResult = { affected: 0 } as DeleteResult;

      repo.delete.mockResolvedValue(deleteResult);

      const result = await service.deleteAnnotationPage(annotPageId, projectId);

      expect(repo.delete).toHaveBeenCalledWith({
        annotationPageId: annotPageId,
        projectId,
      });
      expect(result).toBeInstanceOf(NotFoundException);
    });

    it('throws InternalServerErrorException when repository throws', async () => {
      repo.delete.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(
        service.deleteAnnotationPage('page-1', 5),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});
