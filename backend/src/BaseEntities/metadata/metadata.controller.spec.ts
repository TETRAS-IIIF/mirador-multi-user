import { Test, TestingModule } from '@nestjs/testing';
import { MetadataController } from './metadata.controller';
import { MetadataService } from './metadata.service';
import { CreateMetadataDto } from './dto/create-metadata.dto';
import { ObjectTypes } from '../../enum/ObjectTypes';

describe('MetadataController', () => {
  let controller: MetadataController;
  let service: jest.Mocked<MetadataService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<MetadataService>> = {
      create: jest.fn(),
      getMetadataForObjectId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetadataController],
      providers: [
        {
          provide: MetadataService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get(MetadataController);
    service = module.get(MetadataService) as jest.Mocked<MetadataService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() forwards dto to MetadataService.create', async () => {
    const dto: CreateMetadataDto = {} as any;

    const created = { id: 1, ...dto };
    service.create.mockResolvedValue(created as any);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(created);
  });

  it('getMetadataForObject() forwards params to MetadataService.getMetadataForObjectId', async () => {
    const objectType = ObjectTypes.MEDIA;
    const objectId = 42;

    const metadata = { id: 1, objectType, objectId };
    service.getMetadataForObjectId.mockResolvedValue(metadata as any);

    const result = await controller.getMetadataForObject(
      objectType,
      objectId as any,
    );

    expect(service.getMetadataForObjectId).toHaveBeenCalledWith(
      objectType,
      objectId,
    );
    expect(result).toBe(metadata);
  });
});
