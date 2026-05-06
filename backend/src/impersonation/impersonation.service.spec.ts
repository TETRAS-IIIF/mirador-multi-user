import { Test, TestingModule } from '@nestjs/testing';
import { ImpersonationService } from './impersonation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Impersonation } from './entities/impersonation.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../BaseEntities/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InternalServerErrorException } from '@nestjs/common';
import { ImpersonateDto } from './dto/impersonateDto';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'uuid-token'),
}));

const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
} as unknown as jest.Mocked<Repository<Impersonation>>;

const mockUsersService = {
  findAdminUser: jest.fn(),
  findOne: jest.fn(),
} as unknown as jest.Mocked<UsersService>;

const mockJwtService = {
  signAsync: jest.fn(),
} as unknown as jest.Mocked<JwtService>;

// ── Helpers ────────────────────────────────────────────────────────────────────
const futureDate = () => new Date(Date.now() + 60_000);
const pastDate = () => new Date(Date.now() - 1_000);

const makeDto = (token: string, userId = 2): ImpersonateDto => ({
  token,
  userId,
});

const makeValidImpersonation = () =>
  ({
    id: 'imp-1',
    token: 'uuid-token',
    used: false,
    exchangeBefore: futureDate(),
    user: {
      id: 2,
      name: 'John Doe',
      isEmailConfirmed: true,
    },
  }) as any;

describe('ImpersonationService', () => {
  let service: ImpersonationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpersonationService,
        { provide: getRepositoryToken(Impersonation), useValue: mockRepo },
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<ImpersonationService>(ImpersonationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─────────────────────────────────────────────
  // initiateImpersonation
  // ─────────────────────────────────────────────
  describe('initiateImpersonation', () => {
    it('should create and save impersonation and return oidcLogoutUrl', async () => {
      const adminUser = { id: 1, isAdmin: true } as any;
      const user = { id: 2 } as any;
      const created = { id: 'imp-1' } as any;
      const saved = { id: 'imp-1', token: 'uuid-token' } as any;

      mockUsersService.findAdminUser.mockResolvedValue(adminUser);
      mockUsersService.findOne.mockResolvedValue(user);
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(saved);

      const result = await service.initiateImpersonation(1, 2);

      expect(mockUsersService.findAdminUser).toHaveBeenCalledWith(1);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(2);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          adminUser,
          user,
          token: 'uuid-token',
          used: false,
          exchangeBefore: expect.any(Date),
        }),
      );
      expect(mockRepo.save).toHaveBeenCalledWith(created);
      expect(result).toHaveProperty('oidcLogoutUrl');
      expect(typeof result.oidcLogoutUrl).toBe('string');
    });

    it('should embed token and userId in the oidcLogoutUrl', async () => {
      const adminUser = { id: 1, isAdmin: true } as any;
      const user = { id: 2 } as any;
      const created = { id: 'imp-1' } as any;

      mockUsersService.findAdminUser.mockResolvedValue(adminUser);
      mockUsersService.findOne.mockResolvedValue(user);
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.initiateImpersonation(1, 2);

      expect(result.oidcLogoutUrl).toContain('uuid-token');
      expect(result.oidcLogoutUrl).toContain('2');
    });

    it('should throw InternalServerErrorException when admin not found', async () => {
      mockUsersService.findAdminUser.mockResolvedValue(null);

      await expect(service.initiateImpersonation(1, 2)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );

      expect(mockUsersService.findOne).not.toHaveBeenCalled();
      expect(mockRepo.create).not.toHaveBeenCalled();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when target user not found', async () => {
      mockUsersService.findAdminUser.mockResolvedValue({ id: 1 } as any);
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.initiateImpersonation(1, 2)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );

      expect(mockRepo.create).not.toHaveBeenCalled();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when repository save fails', async () => {
      mockUsersService.findAdminUser.mockResolvedValue({ id: 1 } as any);
      mockUsersService.findOne.mockResolvedValue({ id: 2 } as any);
      mockRepo.create.mockReturnValue({ id: 'imp-1' } as any);
      mockRepo.save.mockRejectedValue(new Error('DB error'));

      await expect(service.initiateImpersonation(1, 2)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  // ─────────────────────────────────────────────
  // validateToken
  // ─────────────────────────────────────────────
  describe('validateToken', () => {
    it('should return impersonation for a valid token', async () => {
      const imp = makeValidImpersonation();
      mockRepo.findOne.mockResolvedValue(imp);

      const result = await service.validateToken('uuid-token');

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { token: 'uuid-token' },
        relations: ['user'],
      });
      expect(result).toEqual(imp);
    });

    it('should throw when token is not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.validateToken('missing-token')).rejects.toThrow(
        'Token not found: missing-token',
      );
    });

    it('should throw when token is already used', async () => {
      const imp = makeValidImpersonation();
      mockRepo.findOne.mockResolvedValue({ ...imp, used: true });

      await expect(service.validateToken('uuid-token')).rejects.toThrow(
        'Token already used: uuid-token',
      );
    });

    it('should throw when token is expired', async () => {
      const imp = makeValidImpersonation();
      mockRepo.findOne.mockResolvedValue({
        ...imp,
        exchangeBefore: pastDate(),
      });

      await expect(service.validateToken('uuid-token')).rejects.toThrow(
        'Token expired: uuid-token',
      );
    });
  });

  // ─────────────────────────────────────────────
  // impersonateUserData
  // ─────────────────────────────────────────────
  describe('impersonateUserData', () => {
    it('should return access_token for a valid token', async () => {
      const imp = makeValidImpersonation();
      mockRepo.findOne.mockResolvedValue(imp);
      mockRepo.save.mockResolvedValue({ ...imp, used: true });
      mockJwtService.signAsync.mockResolvedValue('signed-jwt');

      const result = await service.impersonateUserData(makeDto('uuid-token'));

      expect(result).toEqual({ access_token: 'signed-jwt' });
    });

    it('should mark the impersonation token as used', async () => {
      const imp = makeValidImpersonation();
      mockRepo.findOne.mockResolvedValue(imp);
      mockRepo.save.mockResolvedValue({ ...imp, used: true });
      mockJwtService.signAsync.mockResolvedValue('signed-jwt');

      await service.impersonateUserData(makeDto('uuid-token'));

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ used: true }),
      );
    });

    it('should sign JWT with correct payload', async () => {
      const imp = makeValidImpersonation();
      mockRepo.findOne.mockResolvedValue(imp);
      mockRepo.save.mockResolvedValue({ ...imp, used: true });
      mockJwtService.signAsync.mockResolvedValue('signed-jwt');

      await service.impersonateUserData(makeDto('uuid-token'));

      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: 2,
        user: 'John Doe',
        isEmailConfirmed: true,
      });
    });

    it('should throw InternalServerErrorException when token is not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.impersonateUserData(makeDto('bad-token')),
      ).rejects.toBeInstanceOf(InternalServerErrorException);

      expect(mockRepo.save).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when token is already used', async () => {
      const imp = makeValidImpersonation();
      mockRepo.findOne.mockResolvedValue({ ...imp, used: true });

      await expect(
        service.impersonateUserData(makeDto('uuid-token')),
      ).rejects.toBeInstanceOf(InternalServerErrorException);

      expect(mockRepo.save).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when token is expired', async () => {
      const imp = makeValidImpersonation();
      mockRepo.findOne.mockResolvedValue({
        ...imp,
        exchangeBefore: pastDate(),
      });

      await expect(
        service.impersonateUserData(makeDto('uuid-token')),
      ).rejects.toBeInstanceOf(InternalServerErrorException);

      expect(mockRepo.save).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when jwtService.signAsync fails', async () => {
      const imp = makeValidImpersonation();
      mockRepo.findOne.mockResolvedValue(imp);
      mockRepo.save.mockResolvedValue({ ...imp, used: true });
      mockJwtService.signAsync.mockRejectedValue(new Error('JWT error'));

      await expect(
        service.impersonateUserData(makeDto('uuid-token')),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('should not call usersService.findOne', async () => {
      const imp = makeValidImpersonation();
      mockRepo.findOne.mockResolvedValue(imp);
      mockRepo.save.mockResolvedValue({ ...imp, used: true });
      mockJwtService.signAsync.mockResolvedValue('signed-jwt');

      await service.impersonateUserData(makeDto('uuid-token'));

      expect(mockUsersService.findOne).not.toHaveBeenCalled();
    });
  });
});
