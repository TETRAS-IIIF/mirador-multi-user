import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../BaseEntities/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailServerService } from '../utils/email/email.service';
import { ImpersonationService } from '../impersonation/impersonation.service';
import { LinkUserGroupService } from '../LinkModules/link-user-group/link-user-group.service';
import { SettingsService } from '../BaseEntities/setting/setting.service';

describe('AuthService', () => {
  let service: AuthService;

  // simple Jest mocks for all deps
  const usersServiceMock = {
    findOneByMail: jest.fn(),
    findOne: jest.fn(),
    updateUser: jest.fn(),
  } as any;

  const jwtServiceMock = {
    signAsync: jest.fn(),
    sign: jest.fn(),
    verify: jest.fn(),
  } as any;

  const emailServiceMock = {
    sendResetPasswordLink: jest.fn(),
    sendInternalServerErrorNotification: jest.fn(),
  } as any;

  const impersonationServiceMock = {
    validateToken: jest.fn(),
  } as any;

  const linkUserGroupServiceMock = {
    createUser: jest.fn(),
    sendConfirmationLink: jest.fn(),
    findUserPersonalGroup: jest.fn(),
  } as any;

  const settingsServiceMock = {
    get: jest.fn(),
    set: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: EmailServerService, useValue: emailServiceMock },
        { provide: ImpersonationService, useValue: impersonationServiceMock },
        { provide: LinkUserGroupService, useValue: linkUserGroupServiceMock },
        { provide: SettingsService, useValue: settingsServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    it('should return an access token for valid credentials', async () => {
      const mockUser = {
        id: '1',
        mail: 'test@example.com',
        name: 'Test User',
        password: '$2b$10$somehashedpassword',
        isEmailConfirmed: true,
        termsValidatedAt: new Date(),
        loginCounter: 5,
      };

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      usersServiceMock.findOneByMail.mockResolvedValue(mockUser);
      usersServiceMock.updateUser.mockResolvedValue(undefined);
      jwtServiceMock.signAsync.mockResolvedValue('mock-jwt-token');

      const result = await service.signIn(
        'test@example.com',
        'password123',
        undefined,
      );

      expect(result).toEqual({ access_token: 'mock-jwt-token' });
      expect(usersServiceMock.findOneByMail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(usersServiceMock.updateUser).toHaveBeenCalledWith('1', {
        lastConnectedAt: expect.any(Date),
        loginCounter: 6,
      });
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: '1',
        user: 'Test User',
        isEmailConfirmed: true,
        termsValidatedAt: mockUser.termsValidatedAt,
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      usersServiceMock.findOneByMail.mockResolvedValue(null);

      await expect(
        service.signIn('nonexistent@example.com', 'password123', undefined),
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const mockUser = {
        id: '1',
        mail: 'test@example.com',
        password: '$2b$10$somehashedpassword',
      };

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      usersServiceMock.findOneByMail.mockResolvedValue(mockUser);

      await expect(
        service.signIn('test@example.com', 'wrongpassword', undefined),
      ).rejects.toThrow('Unauthorized');
    });

    it('should handle impersonation token', async () => {
      const mockImpersonation = {
        user: {
          mail: 'impersonated@example.com',
        },
      };

      const mockUser = {
        id: '2',
        mail: 'impersonated@example.com',
        name: 'Impersonated User',
        isEmailConfirmed: true,
        termsValidatedAt: new Date(),
      };

      impersonationServiceMock.validateToken.mockResolvedValue(
        mockImpersonation,
      );
      usersServiceMock.findOneByMail.mockResolvedValue(mockUser);
      jwtServiceMock.signAsync.mockResolvedValue('impersonation-jwt-token');

      const result = await service.signIn('', '', 'impersonation-token');

      expect(result).toEqual({ access_token: 'impersonation-jwt-token' });
      expect(impersonationServiceMock.validateToken).toHaveBeenCalledWith(
        'impersonation-token',
      );
      expect(usersServiceMock.findOneByMail).toHaveBeenCalledWith(
        'impersonated@example.com',
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send reset password email for valid user', async () => {
      const mockUser = {
        id: '1',
        mail: 'test@example.com',
        name: 'Test User',
      };

      usersServiceMock.findOneByMail.mockResolvedValue(mockUser);
      jwtServiceMock.sign.mockReturnValue('reset-token');
      usersServiceMock.updateUser.mockResolvedValue(undefined);
      emailServiceMock.sendResetPasswordLink.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com');

      expect(usersServiceMock.findOneByMail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(jwtServiceMock.sign).toHaveBeenCalledWith(
        { mail: mockUser.mail, name: mockUser.name },
        expect.objectContaining({
          secret: process.env.JWT_EMAIL_VERIFICATION_TOKEN_SECRET,
          expiresIn: '900s',
        }),
      );
      expect(usersServiceMock.updateUser).toHaveBeenCalledWith('1', {
        resetToken: 'reset-token',
      });
      expect(emailServiceMock.sendResetPasswordLink).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user is not found', async () => {
      usersServiceMock.findOneByMail.mockResolvedValue(null);

      await expect(
        service.forgotPassword('nonexistent@example.com'),
      ).rejects.toThrow('No user found for email: nonexistent@example.com');
    });
  });
});
