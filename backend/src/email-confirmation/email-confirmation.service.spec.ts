import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { EmailConfirmationService } from './email-confirmation.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../BaseEntities/users/users.service';

describe('EmailConfirmationService', () => {
  let service: EmailConfirmationService;
  let jwtService: jest.Mocked<JwtService>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const jwtMock: Partial<jest.Mocked<JwtService>> = {
      verify: jest.fn(),
    };

    const usersMock: Partial<jest.Mocked<UsersService>> = {
      getByEmail: jest.fn(),
      validTermsForUser: jest.fn(),
      markEmailAsConfirmed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailConfirmationService,
        { provide: JwtService, useValue: jwtMock },
        { provide: UsersService, useValue: usersMock },
      ],
    }).compile();

    service = module.get(EmailConfirmationService);
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('confirmEmail', () => {
    it('calls validTermsForUser and markEmailAsConfirmed when not yet confirmed', async () => {
      usersService.getByEmail.mockResolvedValue({
        email: 'user@test.com',
        isEmailConfirmed: false,
        termsValidatedAt: null,
      } as any);

      await service.confirmEmail('user@test.com');

      expect(usersService.getByEmail).toHaveBeenCalledWith('user@test.com');
      expect(usersService.validTermsForUser).toHaveBeenCalledWith(
        'user@test.com',
      );
      expect(usersService.markEmailAsConfirmed).toHaveBeenCalledWith(
        'user@test.com',
      );
    });

    it('throws BadRequestException if email and terms already confirmed', async () => {
      usersService.getByEmail.mockResolvedValue({
        email: 'user@test.com',
        isEmailConfirmed: true,
        termsValidatedAt: new Date(),
      } as any);

      await expect(
        service.confirmEmail('user@test.com'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(usersService.validTermsForUser).not.toHaveBeenCalled();
      expect(usersService.markEmailAsConfirmed).not.toHaveBeenCalled();
    });
  });

  describe('decodeConfirmationToken', () => {
    it('returns email when token is valid and payload has email', async () => {
      jwtService.verify.mockReturnValue({ email: 'user@test.com' } as any);

      const email = await service.decodeConfirmationToken('valid-token');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token', {
        secret: process.env.JWT_EMAIL_VERIFICATION_TOKEN_SECRET,
      });
      expect(email).toBe('user@test.com');
    });

    it('throws BadRequestException when payload has no email', async () => {
      jwtService.verify.mockReturnValue({} as any);

      await expect(
        service.decodeConfirmationToken('token-without-email'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws UnauthorizedException when token is expired', async () => {
      const err = new Error('expired') as any;
      err.name = 'TokenExpiredError';
      jwtService.verify.mockImplementation(() => {
        throw err;
      });

      await expect(
        service.decodeConfirmationToken('expired-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws BadRequestException("Bad confirmation token") for other errors', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('some jwt error');
      });

      await expect(
        service.decodeConfirmationToken('bad-token'),
      ).rejects.toEqual(
        expect.objectContaining({
          message: 'Bad confirmation token',
        }),
      );
    });
  });
});
