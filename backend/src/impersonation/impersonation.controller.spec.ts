import { Test, TestingModule } from '@nestjs/testing';
import { ImpersonationController } from './impersonation.controller';
import { ImpersonationService } from './impersonation.service';
import { ImpersonateDto } from './dto/impersonateDto';
import { AuthGuard } from '../auth/auth.guard'; // adjust path if needed

describe('ImpersonationController', () => {
  let controller: ImpersonationController;
  let impersonationService: jest.Mocked<ImpersonationService>;

  beforeEach(async () => {
    const mockImpersonationService: Partial<jest.Mocked<ImpersonationService>> =
      {
        initiateImpersonation: jest.fn(),
        impersonateUserData: jest.fn(),
      };

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
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ImpersonationController>(ImpersonationController);
    impersonationService = module.get(
      ImpersonationService,
    ) as jest.Mocked<ImpersonationService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('impersonateUser builds redirectUrl and returns it', async () => {
    process.env.FRONTEND_URL = 'https://frontend.test';

    impersonationService.initiateImpersonation.mockResolvedValue({
      token: 'fake-token',
      user: { id: 2, email: 'user@test.com' },
    } as any);

    const req = { user: { sub: 1 } } as any;
    const json = jest.fn();
    const res = { json } as any;

    await controller.impersonateUser(2 as any, req, res);

    expect(impersonationService.initiateImpersonation).toHaveBeenCalledWith(
      1, // adminUserId
      2, // userId
    );

    expect(json).toHaveBeenCalledWith({
      redirectUrl: 'https://frontend.test/impersonate/?token=fake-token',
      user: { id: 2, email: 'user@test.com' },
    });
  });

  it('impersonate forwards dto to service', async () => {
    const dto: ImpersonateDto = {
      userId: 2,
      adminId: 1,
      reason: 'test',
    } as any;

    impersonationService.impersonateUserData.mockResolvedValue({
      access_token: 'jwt-token',
    } as any);

    const result = await controller.impersonate(dto);

    expect(impersonationService.impersonateUserData).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ access_token: 'jwt-token' });
  });
});
