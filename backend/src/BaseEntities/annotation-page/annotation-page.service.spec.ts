import { Test, TestingModule } from '@nestjs/testing';
import { AnnotationPageService } from './annotation-page.service';
import { AnnotationService } from '../annotation/annotation.service';
import { CreateAnnotationPageDto } from './dto/create-annotation-page.dto';

describe('AnnotationPageService', () => {
  let service: AnnotationPageService;
  let rows: jest.Mocked<
    Pick<
      AnnotationService,
      'replacePage' | 'getProjectPages' | 'getPage' | 'deletePage'
    >
  >;
  const caller = { id: 3, name: 'alice' };
  const page = {
    id: 1,
    projectId: 42,
    annotationPageId: 'canvas/annotationPage',
    content: { id: 'canvas/annotationPage', type: 'AnnotationPage', items: [] },
  };

  beforeEach(async () => {
    rows = {
      replacePage: jest.fn().mockResolvedValue([page]),
      getProjectPages: jest.fn().mockResolvedValue([page]),
      getPage: jest.fn().mockResolvedValue([page]),
      deletePage: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnotationPageService,
        { provide: AnnotationService, useValue: rows },
      ],
    }).compile();
    service = module.get(AnnotationPageService);
  });

  it('create() syncs the rows of the page with its items', async () => {
    const dto = {
      projectId: 42,
      annotationPageId: 'canvas/annotationPage',
      content: { items: [] },
    } as unknown as CreateAnnotationPageDto;
    await expect(service.create(dto, caller)).resolves.toEqual([page]);
    expect(rows.replacePage).toHaveBeenCalledWith(
      42,
      'canvas/annotationPage',
      dto.content,
      caller,
    );
  });

  it('findAllProjectAnnotation() returns published pages for export', async () => {
    await service.findAllProjectAnnotation(42);
    expect(rows.getProjectPages).toHaveBeenCalledWith(42, { forExport: true });
  });

  it('findAll() keeps the array contract and passes the drafts flag', async () => {
    await expect(service.findAll('p', 42, true)).resolves.toEqual([page]);
    expect(rows.getPage).toHaveBeenCalledWith(42, 'p', true);
  });

  it('deleteAnnotationPage() deletes the page and its rows', async () => {
    await service.deleteAnnotationPage('p', 42);
    expect(rows.deletePage).toHaveBeenCalledWith(42, 'p');
  });
});
