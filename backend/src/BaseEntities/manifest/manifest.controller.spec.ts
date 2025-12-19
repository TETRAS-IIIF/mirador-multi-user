import { Test, TestingModule } from '@nestjs/testing';
import { ManifestController } from './manifest.controller';
import { ManifestService } from './manifest.service';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

describe('ManifestController', () => {
  let controller: ManifestController;
  let service: jest.Mocked<ManifestService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<ManifestService>> = {
      findManifestsByPartialStringAndUserGroup: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManifestController],
      providers: [
        {
          provide: ManifestService,
          useValue: serviceMock,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
            getAllAndMerge: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ManifestController);
    service = module.get(ManifestService) as jest.Mocked<ManifestService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('lookingForManifest forwards params to ManifestService.findManifestsByPartialStringAndUserGroup', async () => {
    const userGroupId = 42;
    const partialString = 'demo';

    const manifests = [{ id: 1 }, { id: 2 }];
    service.findManifestsByPartialStringAndUserGroup.mockResolvedValue(
      manifests as any,
    );

    const result = await controller.lookingForManifest(
      userGroupId as any,
      partialString,
    );

    expect(
      service.findManifestsByPartialStringAndUserGroup,
    ).toHaveBeenCalledWith(partialString, userGroupId);
    expect(result).toBe(manifests);
  });
});
