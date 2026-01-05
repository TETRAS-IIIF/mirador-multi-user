import { Test, TestingModule } from '@nestjs/testing';
import { ImpersonationService } from './impersonation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Impersonation } from './entities/impersonation.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../BaseEntities/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InternalServerErrorException } from '@nestjs/common';

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

describe('ImpersonationService', () => {
  let service: ImpersonationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpersonationService,
        {
          provide: getRepositoryToken(Impersonation),
          useValue: mockRepo,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<ImpersonationService>(ImpersonationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('initiateImpersonation should create and save impersonation', async () => {
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
    expect(result).toBe(saved);
  });

  it('initiateImpersonation should throw InternalServerErrorException when admin not found', async () => {
    mockUsersService.findAdminUser.mockResolvedValue(null);

    await expect(service.initiateImpersonation(1, 2)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('validateToken should return impersonation when valid and not expired', async () => {
    const impersonation = {
      id: 'imp-1',
      token: 'uuid-token',
      used: false,
      exchangeBefore: new Date(Date.now() + 60_000),
      user: { id: 2 },
    } as any;
    mockRepo.findOne.mockResolvedValue(impersonation);

    const result = await service.validateToken('uuid-token');

    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { token: 'uuid-token', used: false },
      relations: ['user'],
    });
    expect(result).toBe(impersonation);
  });

  it('validateToken should throw when token invalid or expired', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    await expect(service.validateToken('bad-token')).rejects.toThrow(
      'Invalid or expired token',
    );
  });

  it('impersonateUserData should return access_token when token valid', async () => {
    const dto = { token: 'uuid-token', userId: 2 } as any;
    const user = {
      id: 2,
      name: 'John',
      isEmailConfirmed: true,
    } as any;

    jest.spyOn(service, 'validateToken').mockResolvedValue({ user } as any);
    mockUsersService.findOne.mockResolvedValue(user);
    mockJwtService.signAsync.mockResolvedValue('jwt-token');

    const result = await service.impersonateUserData(dto);

    expect(service.validateToken).toHaveBeenCalledWith('uuid-token');
    expect(mockUsersService.findOne).toHaveBeenCalledWith(2);
    expect(mockJwtService.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      user: user.name,
      isEmailConfirmed: user.isEmailConfirmed,
    });
    expect(result).toEqual({ access_token: 'jwt-token' });
  });

  it('impersonateUserData should throw InternalServerErrorException on error', async () => {
    const dto = { token: 'bad-token', userId: 2 } as any;

    jest
      .spyOn(service, 'validateToken')
      .mockRejectedValue(new Error('Invalid or expired token'));

    await expect(service.impersonateUserData(dto)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
