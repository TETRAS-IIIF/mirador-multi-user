import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../BaseEntities/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailServerService } from '../utils/email/email.service';
import { ImpersonationService } from '../impersonation/impersonation.service';
import { LinkUserGroupService } from '../LinkModules/link-user-group/link-user-group.service';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: EmailServerService, useValue: emailServiceMock },
        { provide: ImpersonationService, useValue: impersonationServiceMock },
        { provide: LinkUserGroupService, useValue: linkUserGroupServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
