import { Test, TestingModule } from '@nestjs/testing';
import { ImpersonationController } from './impersonation.controller';
import { ImpersonationService } from './impersonation.service';
import { AuthGuard } from '../auth/auth.guard';

const mockImpersonationService = {
  initiateImpersonation: jest.fn(),
  impersonateUserData: jest.fn(),
};

describe('ImpersonationController', () => {
  let controller: ImpersonationController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImpersonationController],
      providers: [
        {
          provide: ImpersonationService,
          useValue: mockImpersonationService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ImpersonationController>(ImpersonationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('initiate should call initiateImpersonation and return oidcLogoutUrl', async () => {
    const oidcLogoutUrl = 'https://keycloak/logout?...';
    mockImpersonationService.initiateImpersonation.mockResolvedValue({
      oidcLogoutUrl,
    });

    const req = { user: { sub: 1 } };
    const result = await controller.initiate({ targetUserId: 2 }, req);

    expect(mockImpersonationService.initiateImpersonation).toHaveBeenCalledWith(
      1,
      2,
    );
    expect(result).toEqual({ oidcLogoutUrl });
  });

  it('callback should call impersonateUserData and return access_token', async () => {
    mockImpersonationService.impersonateUserData.mockResolvedValue({
      access_token: 'jwt-token',
    });

    const result = await controller.callback('uuid-token', 2);

    expect(mockImpersonationService.impersonateUserData).toHaveBeenCalledWith({
      token: 'uuid-token',
      userId: 2,
    });
    expect(result).toEqual({ access_token: 'jwt-token' });
  });
});
