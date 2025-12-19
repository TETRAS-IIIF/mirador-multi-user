import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<AuthService>> = {
      signIn: jest.fn(),
      findProfile: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      exchangeOidcCode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: serviceMock,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService) as jest.Mocked<AuthService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('signIn() calls AuthService.signIn with dto fields', async () => {
    const dto: any = {
      mail: 'user@test.com',
      password: 'pass',
      isImpersonate: false,
    };
    const resultValue = { access_token: 'jwt' } as any;
    service.signIn.mockResolvedValue(resultValue);

    const result = await controller.signIn(dto);

    expect(service.signIn).toHaveBeenCalledWith('user@test.com', 'pass', false);
    expect(result).toBe(resultValue);
  });

  it('getProfile() calls AuthService.findProfile with req.user.sub', async () => {
    const req: any = { user: { sub: 123 } };
    const profile = { id: 123, mail: 'user@test.com' } as any;
    service.findProfile.mockResolvedValue(profile);

    const result = await controller.getProfile(req);

    expect(service.findProfile).toHaveBeenCalledWith(123);
    expect(result).toBe(profile);
  });

  it('forgotPassword() calls AuthService.forgotPassword with email', async () => {
    const email = 'user@test.com';
    service.forgotPassword.mockResolvedValue(undefined);

    const result = await controller.forgotPassword({ email });

    expect(service.forgotPassword).toHaveBeenCalledWith(email);
    expect(result).toBeUndefined();
  });

  it('resetPassword() calls AuthService.resetPassword with token and password', async () => {
    const token = 'token';
    const password = 'newPass';
    service.resetPassword.mockResolvedValue(undefined);

    const result = await controller.resetPassword({ token, password });

    expect(service.resetPassword).toHaveBeenCalledWith(token, password);
    expect(result).toBeUndefined();
  });

  it('exchangeCode() calls AuthService.exchangeOidcCode and wraps result', async () => {
    const body = { code: 'code123', redirectUri: 'http://redirect' };
    service.exchangeOidcCode.mockResolvedValue('jwt-token');

    const result = await controller.exchangeCode(body);

    expect(service.exchangeOidcCode).toHaveBeenCalledWith(
      'code123',
      'http://redirect',
    );
    expect(result).toEqual({ access_token: 'jwt-token' });
  });
});
