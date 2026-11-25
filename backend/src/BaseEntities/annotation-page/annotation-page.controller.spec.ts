import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AnnotationPageController } from './annotation-page.controller';
import { AnnotationPageService } from './annotation-page.service';
import { CreateAnnotationPageDto } from './dto/create-annotation-page.dto';
import { JwtService } from '@nestjs/jwt';
import { LinkGroupProjectService } from '../../LinkModules/link-group-project/link-group-project.service';
import { AuthGuard } from '../../auth/auth.guard';
import { GroupProjectRights } from '../../enum/rights';

describe('AnnotationPageController', () => {
  let controller: AnnotationPageController;
  let service: jest.Mocked<AnnotationPageService>;
  let links: { getHighestRightForProject: jest.Mock };

  const USER_ID = 7;
  const PROJECT_ID = 42;
  const request = { user: { sub: USER_ID } };
  const giveRight = (rights: GroupProjectRights | null) =>
    links.getHighestRightForProject.mockResolvedValue(
      rights ? { rights } : null,
    );

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<AnnotationPageService>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findAllProjectAnnotation: jest.fn(),
      deleteAnnotationPage: jest.fn(),
    };
    links = { getHighestRightForProject: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnotationPageController],
      providers: [
        { provide: AnnotationPageService, useValue: serviceMock },
        { provide: LinkGroupProjectService, useValue: links },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn(), verifyAsync: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AnnotationPageController>(AnnotationPageController);
    service = module.get(
      AnnotationPageService,
    ) as jest.Mocked<AnnotationPageService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it.each([
    'create',
    'findAll',
    'findOne',
    'findAllAnnotationForProject',
    'delete',
  ])('%s() is protected by AuthGuard', (handler) => {
    const guards =
      Reflect.getMetadata(
        GUARDS_METADATA,
        AnnotationPageController.prototype[handler],
      ) ?? [];
    expect(guards).toContain(AuthGuard);
  });

  describe('with editor rights', () => {
    beforeEach(() => giveRight(GroupProjectRights.EDITOR));

    it('create() checks the project from the body and forwards the dto', async () => {
      const dto = { projectId: PROJECT_ID } as CreateAnnotationPageDto;
      const created = { id: 1 };
      service.create.mockResolvedValue(created as any);

      const result = await controller.create(dto, request);

      expect(links.getHighestRightForProject).toHaveBeenCalledWith(
        USER_ID,
        PROJECT_ID,
      );
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(created);
    });

    it('delete() decodes annotationPageId and forwards to service', async () => {
      const encoded = encodeURIComponent('http://example.com/anno/2');
      const expected = { success: true };
      service.deleteAnnotationPage.mockResolvedValue(expected as any);

      const result = await controller.delete(PROJECT_ID, encoded, request);

      expect(service.deleteAnnotationPage).toHaveBeenCalledWith(
        'http://example.com/anno/2',
        PROJECT_ID,
      );
      expect(result).toBe(expected);
    });
  });

  describe('with reader rights', () => {
    beforeEach(() => giveRight(GroupProjectRights.READER));

    it('findAll() forwards params to service', async () => {
      const expected = [{ id: 'a' }, { id: 'b' }];
      service.findAll.mockResolvedValue(expected as any);

      const result = await controller.findAll(PROJECT_ID, 'page-123', request);

      expect(service.findAll).toHaveBeenCalledWith('page-123', PROJECT_ID);
      expect(result).toBe(expected);
    });

    it('findOne() decodes annotationPageId and forwards to service', async () => {
      const encoded = encodeURIComponent('http://example.com/anno/1');
      const expected = { id: 'anno-1' };
      service.findOne.mockResolvedValue(expected as any);

      const result = await controller.findOne(encoded, PROJECT_ID, request);

      expect(service.findOne).toHaveBeenCalledWith(
        'http://example.com/anno/1',
        PROJECT_ID,
      );
      expect(result).toBe(expected);
    });

    it('findAllAnnotationForProject() forwards projectId', async () => {
      service.findAllProjectAnnotation.mockResolvedValue([] as any);

      await controller.findAllAnnotationForProject(PROJECT_ID, 99, request);

      expect(service.findAllProjectAnnotation).toHaveBeenCalledWith(PROJECT_ID);
    });

    it('create() is refused', async () => {
      await expect(
        controller.create(
          { projectId: PROJECT_ID } as CreateAnnotationPageDto,
          request,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.create).not.toHaveBeenCalled();
    });

    it('delete() is refused', async () => {
      await expect(
        controller.delete(PROJECT_ID, 'page', request),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.deleteAnnotationPage).not.toHaveBeenCalled();
    });
  });

  describe('without access to the project', () => {
    beforeEach(() => giveRight(null));

    it.each([
      [
        'create',
        () => controller.create({ projectId: PROJECT_ID } as any, request),
      ],
      ['findAll', () => controller.findAll(PROJECT_ID, 'p', request)],
      ['findOne', () => controller.findOne('p', PROJECT_ID, request)],
      [
        'findAllAnnotationForProject',
        () => controller.findAllAnnotationForProject(PROJECT_ID, 1, request),
      ],
      ['delete', () => controller.delete(PROJECT_ID, 'p', request)],
    ])('%s() is refused', async (_name, call) => {
      await expect(call()).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('never reaches the service', async () => {
      await Promise.allSettled([
        controller.create({ projectId: PROJECT_ID } as any, request),
        controller.findAll(PROJECT_ID, 'p', request),
        controller.findOne('p', PROJECT_ID, request),
        controller.findAllAnnotationForProject(PROJECT_ID, 1, request),
        controller.delete(PROJECT_ID, 'p', request),
      ]);
      Object.values(service).forEach((fn) => expect(fn).not.toHaveBeenCalled());
    });
  });
});
