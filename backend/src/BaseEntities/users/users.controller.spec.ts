import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<UsersService>> = {
      updateUser: jest.fn(),
      findOne: jest.fn(),
      validTermsForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: serviceMock,
        },
        // deps of AuthGuard
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

    controller = module.get(UsersController);
    service = module.get(UsersService) as jest.Mocked<UsersService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('updateUser() calls UsersService.updateUser with sub and dto', async () => {
    const dto: UpdateUserDto = {} as any;
    const req = { user: { sub: 123 } } as any;
    const updatedUser = { id: 123, mail: 'user@test.com' };

    service.updateUser.mockResolvedValue(updatedUser as any);

    const result = await controller.updateUser(dto, req);

    expect(service.updateUser).toHaveBeenCalledWith(123, dto);
    expect(result).toBe(updatedUser);
  });

  it('validTerms() loads user and calls validTermsForUser with user.mail', async () => {
    const req = { user: { sub: 456 } } as any;
    const user = { id: 456, mail: 'user2@test.com' };

    service.findOne.mockResolvedValue(user as any);
    service.validTermsForUser.mockResolvedValue(undefined);

    const result = await controller.validTerms(req);

    expect(service.findOne).toHaveBeenCalledWith(456);
    expect(service.validTermsForUser).toHaveBeenCalledWith('user2@test.com');
    expect(result).toBeUndefined();
  });
});
