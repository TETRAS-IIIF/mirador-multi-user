import { Test, TestingModule } from '@nestjs/testing';
import { AnnotationPageController } from './annotation-page.controller';
import { AnnotationPageService } from './annotation-page.service';
import { CreateAnnotationPageDto } from './dto/create-annotation-page.dto';

describe('AnnotationPageController', () => {
  let controller: AnnotationPageController;
  let service: jest.Mocked<AnnotationPageService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<AnnotationPageService>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      deleteAnnotationPage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnotationPageController],
      providers: [
        {
          provide: AnnotationPageService,
          useValue: serviceMock,
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

  it('create() forwards dto to service', async () => {
    const dto: CreateAnnotationPageDto = {
      // fill required fields if any
    } as any;

    const created = { id: 1, ...dto };
    service.create.mockResolvedValue(created as any);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(created);
  });

  it('findAll() forwards params to service', async () => {
    const projectId = 42;
    const annotPageId = 'page-123';

    const expected = [{ id: 'a' }, { id: 'b' }];
    service.findAll.mockResolvedValue(expected as any);

    const result = await controller.findAll(projectId as any, annotPageId);

    expect(service.findAll).toHaveBeenCalledWith(annotPageId, projectId);
    expect(result).toBe(expected);
  });

  it('findOne() decodes annotationPageId and forwards to service', async () => {
    const projectId = 42;
    const encoded = encodeURIComponent('http://example.com/anno/1');
    const decoded = 'http://example.com/anno/1';

    const expected = { id: 'anno-1' };
    service.findOne.mockResolvedValue(expected as any);

    const result = await controller.findOne(encoded, projectId as any);

    expect(service.findOne).toHaveBeenCalledWith(decoded, projectId);
    expect(result).toBe(expected);
  });

  it('delete() decodes annotationPageId and forwards to service', async () => {
    const projectId = 42;
    const encoded = encodeURIComponent('http://example.com/anno/2');
    const decoded = 'http://example.com/anno/2';

    const expected = { success: true };
    service.deleteAnnotationPage.mockResolvedValue(expected as any);

    const result = await controller.delete(projectId as any, encoded);

    expect(service.deleteAnnotationPage).toHaveBeenCalledWith(
      decoded,
      projectId,
    );
    expect(result).toBe(expected);
  });
});
