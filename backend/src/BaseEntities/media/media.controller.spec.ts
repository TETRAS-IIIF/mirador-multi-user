import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { AuthGuard } from '../../auth/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

describe('MediaController', () => {
  let controller: MediaController;
  let service: jest.Mocked<MediaService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<MediaService>> = {
      findMediasByPartialStringAndUserGroup: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        {
          provide: MediaService,
          useValue: serviceMock,
        },
        // deps of AuthGuard so Nest can instantiate it
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
            signAsync: jest.fn(),
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
        {
          provide: AuthGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
      ],
    }).compile();

    controller = module.get(MediaController);
    service = module.get(MediaService) as jest.Mocked<MediaService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('lookingForMedia() forwards params to MediaService.findMediasByPartialStringAndUserGroup', async () => {
    const userGroupId = 42;
    const partialString = 'demo';

    const medias = [{ id: 1 }, { id: 2 }];
    service.findMediasByPartialStringAndUserGroup.mockResolvedValue(
      medias as any,
    );

    const result = await controller.lookingForMedia(
      userGroupId as any,
      partialString,
    );

    expect(service.findMediasByPartialStringAndUserGroup).toHaveBeenCalledWith(
      partialString,
      userGroupId,
    );
    expect(result).toBe(medias);
  });
});
