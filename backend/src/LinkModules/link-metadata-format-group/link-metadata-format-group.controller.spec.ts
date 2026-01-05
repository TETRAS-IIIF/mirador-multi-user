import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LinkMetadataFormatGroupController } from './link-metadata-format-group.controller';
import { LinkMetadataFormatGroupService } from './link-metadata-format-group.service';
import { CreateLinkMetadataFormatGroupDto } from './dto/create-link-metadata-format-group.dto';
import { AuthGuard } from '../../auth/auth.guard';

describe('LinkMetadataFormatGroupController', () => {
  let controller: LinkMetadataFormatGroupController;
  let service: jest.Mocked<LinkMetadataFormatGroupService>;

  const authGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<LinkMetadataFormatGroupService>> = {
      createMetadataFormat: jest.fn(),
      getMetadataFormatForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinkMetadataFormatGroupController],
      providers: [
        {
          provide: LinkMetadataFormatGroupService,
          useValue: serviceMock,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(authGuardMock)
      .compile();

    controller = module.get(LinkMetadataFormatGroupController);
    service = module.get(
      LinkMetadataFormatGroupService,
    ) as jest.Mocked<LinkMetadataFormatGroupService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() forwards dto to service.createMetadataFormat', async () => {
    const dto: CreateLinkMetadataFormatGroupDto = {
      title: 'My format',
      creatorId: 123,
    } as any;

    const created = { id: 1 };
    service.createMetadataFormat.mockResolvedValue(created as any);

    const result = await controller.create(dto);

    expect(service.createMetadataFormat).toHaveBeenCalledWith(dto);
    expect(result).toBe(created);
  });

  it('getMetadataFormatForUser() calls service when userId matches token sub', async () => {
    const userId = 42;
    const req = { user: { sub: 42 } } as any;

    const formats = [{ id: 1 }, { id: 2 }];
    service.getMetadataFormatForUser.mockResolvedValue(formats as any);

    const result = await controller.getMetadataFormatForUser(
      userId as any,
      req,
    );

    expect(service.getMetadataFormatForUser).toHaveBeenCalledWith(userId);
    expect(result).toBe(formats);
  });

  it('getMetadataFormatForUser() throws UnauthorizedException when userId does not match token sub', () => {
    const userId = 42;
    const req = { user: { sub: 99 } } as any;

    expect(() =>
      controller.getMetadataFormatForUser(userId as any, req),
    ).toThrow(UnauthorizedException);
    expect(service.getMetadataFormatForUser).not.toHaveBeenCalled();
  });
});
