import { Test, TestingModule } from '@nestjs/testing';
import { LinkUserGroupController } from './link-user-group.controller';
import { LinkUserGroupService } from './link-user-group.service';
import { AuthGuard } from '../../auth/auth.guard';
import { ActionType } from '../../enum/actions';
import { UnauthorizedException } from '@nestjs/common';
import { Language } from '../../utils/email/utils';

describe('LinkUserGroupController', () => {
  let controller: LinkUserGroupController;
  let service: jest.Mocked<LinkUserGroupService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<LinkUserGroupService>> = {
      checkPolicies: jest.fn(),
      findAllUsersForGroup: jest.fn(),
      findALlGroupsForUser: jest.fn(),
      getAccessForUserToGroup: jest.fn(),
      createUser: jest.fn(),
      createUserGroup: jest.fn(),
      GrantAccessToUserGroup: jest.fn(),
      sendConfirmationLink: jest.fn(),
      searchForUserGroup: jest.fn(),
      searchForGroups: jest.fn(),
      findUserPersonalGroup: jest.fn(),
      ChangeAccessToUserGroup: jest.fn(),
      updateGroup: jest.fn(),
      RemoveAccessToUserGroup: jest.fn(),
      removeGroupFromLinkEntity: jest.fn(),
      getUserNameWithId: jest.fn(),
      getAllUsers: jest.fn(),
      updateUserLanguage: jest.fn(),
      validateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinkUserGroupController],
      providers: [
        {
          provide: LinkUserGroupService,
          useValue: serviceMock,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<LinkUserGroupController>(LinkUserGroupController);
    service = module.get(
      LinkUserGroupService,
    ) as jest.Mocked<LinkUserGroupService>;

    service.checkPolicies.mockImplementation(
      async (_action, _userId, _groupId, cb: () => Promise<any>) => cb(),
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getAllUsersForGroup() calls checkPolicies then findAllUsersForGroup', async () => {
    const groupId = 10;
    const req: any = {
      user: { sub: 1 },
      metadata: { action: ActionType.READ },
    };
    const users = [{ id: 1 }] as any;

    service.findAllUsersForGroup.mockResolvedValue(users);

    const result = await controller.getAllUsersForGroup(groupId as any, req);

    expect(service.checkPolicies).toHaveBeenCalledWith(
      ActionType.READ,
      1,
      groupId,
      expect.any(Function),
    );
    expect(service.findAllUsersForGroup).toHaveBeenCalledWith(groupId);
    expect(result).toBe(users);
  });

  it('getAllGroupForUser() returns groups when userId matches token sub', async () => {
    const userId = 5;
    const req: any = {
      user: { sub: 5 },
      metadata: { action: ActionType.READ },
    };
    const groups = [{ id: 1 }] as any;

    service.findALlGroupsForUser.mockResolvedValue(groups);

    const result = await controller.getAllGroupForUser(userId as any, req);

    expect(service.findALlGroupsForUser).toHaveBeenCalledWith(userId);
    expect(result).toBe(groups);
  });

  it('getAccessToGroup() forwards to service', () => {
    service.getAccessForUserToGroup.mockReturnValue('access' as any);

    const result = controller.getAccessToGroup(1 as any, 2 as any);

    expect(service.getAccessForUserToGroup).toHaveBeenCalledWith(1, 2);
    expect(result).toBe('access');
  });

  it('createUser() forwards dto to service', async () => {
    const dto: any = { mail: 'test@test.com' };
    const created = { id: 1 } as any;

    service.createUser.mockResolvedValue(created);

    const result = await controller.createUser(dto);

    expect(service.createUser).toHaveBeenCalledWith(dto);
    expect(result).toBe(created);
  });

  it('createGroup() forwards dto to service', () => {
    const dto: any = { title: 'grp' };
    const created = { id: 1 } as any;

    service.createUserGroup.mockReturnValue(created);

    const result = controller.createGroup(dto);

    expect(service.createUserGroup).toHaveBeenCalledWith(dto);
    expect(result).toBe(created);
  });

  it('grantAccess() calls checkPolicies then GrantAccessToUserGroup', async () => {
    const dto: any = { user_groupId: 7, userId: 1 };
    const req: any = {
      user: { sub: 1 },
      metadata: { action: ActionType.UPDATE },
    };
    const returned = { id: 1 } as any;

    service.GrantAccessToUserGroup.mockResolvedValue(returned);

    const result = await controller.grantAccess(dto, req);

    expect(service.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      1,
      dto.user_groupId,
      expect.any(Function),
    );
    expect(service.GrantAccessToUserGroup).toHaveBeenCalledWith(dto);
    expect(result).toBe(returned);
  });

  it('resendConfirmationLink() forwards email and language', async () => {
    service.sendConfirmationLink.mockResolvedValue(undefined);

    await controller.resendConfirmationLink('mail@test.com', 'fr');

    expect(service.sendConfirmationLink).toHaveBeenCalledWith(
      'mail@test.com',
      'fr',
    );
  });

  it('lookingForUser() uses service.searchForUserGroup', () => {
    service.searchForUserGroup.mockReturnValue(['u'] as any);

    const result = controller.lookingForUser('ab');

    expect(service.searchForUserGroup).toHaveBeenCalledWith('ab');
    expect(result).toEqual(['u']);
  });

  it('lookingForUserGroups() uses service.searchForGroups', () => {
    service.searchForGroups.mockReturnValue(['g'] as any);

    const result = controller.lookingForUserGroups('ab');

    expect(service.searchForGroups).toHaveBeenCalledWith('ab');
    expect(result).toEqual(['g']);
  });

  it('getUserPersonalGroup() returns group when userId matches token sub', async () => {
    const group = { id: 1 } as any;
    service.findUserPersonalGroup.mockResolvedValue(group);

    const req: any = { user: { sub: 10 } };
    const result = await controller.getUserPersonalGroup(10 as any, req);

    expect(service.findUserPersonalGroup).toHaveBeenCalledWith(10);
    expect(result).toBe(group);
  });

  it('getUserPersonalGroup() returns UnauthorizedException when userId differs', async () => {
    const req: any = { user: { sub: 10 } };

    const result = await controller.getUserPersonalGroup(11 as any, req);

    expect(result).toBeInstanceOf(UnauthorizedException);
  });

  it('changeAccess() calls checkPolicies then ChangeAccessToUserGroup', async () => {
    const dto: any = { groupId: 3, userId: 2, rights: 'ADMIN' };
    const req: any = {
      user: { sub: 1 },
      metadata: { action: ActionType.UPDATE },
    };
    const returned = { id: 1 } as any;

    service.ChangeAccessToUserGroup.mockResolvedValue(returned);

    const result = await controller.changeAccess(dto, req);

    expect(service.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      1,
      dto.groupId,
      expect.any(Function),
    );
    expect(service.ChangeAccessToUserGroup).toHaveBeenCalledWith(
      dto.groupId,
      dto.userId,
      dto.rights,
      1,
    );
    expect(result).toBe(returned);
  });

  it('updateGroup() calls checkPolicies then updateGroup', async () => {
    const dto: any = { id: 5, title: 'new' };
    const req: any = {
      user: { sub: 1 },
      metadata: { action: ActionType.UPDATE },
    };
    const updated = { id: 5, title: 'new' } as any;

    service.updateGroup.mockResolvedValue(updated);

    const result = await controller.updateGroup(dto, req);

    expect(service.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      1,
      dto.id,
      expect.any(Function),
    );
    expect(service.updateGroup).toHaveBeenCalledWith(dto);
    expect(result).toBe(updated);
  });

  it('removeAccess() calls checkPolicies then RemoveAccessToUserGroup', async () => {
    const req: any = {
      user: { sub: 1 },
      metadata: { action: ActionType.UPDATE },
    };
    const returned = { ok: true } as any;

    service.RemoveAccessToUserGroup.mockResolvedValue(returned);

    const result = await controller.removeAccess(7 as any, 2 as any, req);

    expect(service.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      1,
      7,
      expect.any(Function),
    );
    expect(service.RemoveAccessToUserGroup).toHaveBeenCalledWith(7, 2);
    expect(result).toBe(returned);
  });

  it('remove() calls checkPolicies then removeGroupFromLinkEntity', async () => {
    const req: any = {
      user: { sub: 1 },
      metadata: { action: ActionType.DELETE },
    };
    const returned = { removed: true } as any;

    service.removeGroupFromLinkEntity.mockResolvedValue(returned);

    const result = await controller.remove(9 as any, req);

    expect(service.checkPolicies).toHaveBeenCalledWith(
      ActionType.DELETE,
      1,
      9,
      expect.any(Function),
    );
    expect(service.removeGroupFromLinkEntity).toHaveBeenCalledWith(9);
    expect(result).toBe(returned);
  });

  it('getUserNameWithId() forwards to service', async () => {
    service.getUserNameWithId.mockResolvedValue('John');

    const result = await controller.getUserNameWithId(3 as any);

    expect(service.getUserNameWithId).toHaveBeenCalledWith(3);
    expect(result).toBe('John');
  });

  it('getAllUsers() checks policies on personal group and returns users', async () => {
    const req: any = {
      user: { sub: 1 },
      metadata: { action: ActionType.ADMIN },
    };
    const personalGroup = { id: 100 } as any;
    const users = [{ id: 1 }] as any;

    service.findUserPersonalGroup.mockResolvedValue(personalGroup);
    service.getAllUsers.mockResolvedValue(users);

    const result = await controller.getAllUsers(req);

    expect(service.findUserPersonalGroup).toHaveBeenCalledWith(1);
    expect(service.checkPolicies).toHaveBeenCalledWith(
      ActionType.ADMIN,
      1,
      personalGroup.id,
      expect.any(Function),
    );
    expect(service.getAllUsers).toHaveBeenCalled();
    expect(result).toBe(users);
  });

  it('updateUserLanguage() checks policies and calls updateUserLanguage', async () => {
    const req: any = {
      user: { sub: 1 },
      metadata: { action: ActionType.UPDATE },
    };
    const personalGroup = { id: 100 } as any;
    const returned = { ok: true } as any;
    const dto = { preferredLanguage: Language.FRENCH } as any;

    service.findUserPersonalGroup.mockResolvedValue(personalGroup);
    service.updateUserLanguage.mockResolvedValue(returned);

    const result = await controller.updateUserLanguage(5 as any, req, dto);

    expect(service.findUserPersonalGroup).toHaveBeenCalledWith(1);
    expect(service.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      1,
      personalGroup.id,
      expect.any(Function),
    );
    expect(service.updateUserLanguage).toHaveBeenCalledWith(
      5,
      dto.preferredLanguage,
    );
    expect(result).toBe(returned);
  });

  it('leavingGroup() calls RemoveAccessToUserGroup with groupId and user.sub', async () => {
    const req: any = { user: { sub: 7 } };
    const returned = { left: true } as any;

    service.RemoveAccessToUserGroup.mockResolvedValue(returned);

    const result = await controller.leavingGroup(3 as any, req);

    expect(service.RemoveAccessToUserGroup).toHaveBeenCalledWith(3, 7);
    expect(result).toBe(returned);
  });

  it('validateUserAccount() forwards to validateUser with userId and adminId', async () => {
    const req: any = { user: { sub: 9 } };
    const returned = { validated: true } as any;

    service.validateUser.mockResolvedValue(returned);

    const result = await controller.validateUserAccount(4 as any, req);

    expect(service.validateUser).toHaveBeenCalledWith(4, 9);
    expect(result).toBe(returned);
  });
});
