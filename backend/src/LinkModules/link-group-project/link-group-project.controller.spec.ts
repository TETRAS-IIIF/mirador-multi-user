import { Test, TestingModule } from '@nestjs/testing';
import { LinkGroupProjectController } from './link-group-project.controller';
import { LinkGroupProjectService } from './link-group-project.service';
import { UnauthorizedException } from '@nestjs/common';
import { ActionType } from '../../enum/actions';
import { AuthGuard } from '../../auth/auth.guard';

const mockLinkGroupProjectService = {
  findAllGroupProjectByUserGroupId: jest.fn(),
  getProjectRelations: jest.fn(),
  checkPolicies: jest.fn(),
  lockProject: jest.fn(),
  updateProject: jest.fn(),
  addProjectToGroup: jest.fn(),
  updateAccessToProject: jest.fn(),
  deleteProject: jest.fn(),
  RemoveProjectToGroup: jest.fn(),
  removeProjectFromUser: jest.fn(),
  searchForUserGroupProjectWithPartialProjectName: jest.fn(),
  createProject: jest.fn(),
  findAllUserProjects: jest.fn(),
  duplicateProject: jest.fn(),
  generateProjectSnapshot: jest.fn(),
  updateSnapshot: jest.fn(),
  deleteSnapshot: jest.fn(),
  isProjectLocked: jest.fn(),
} as any;

const mockAuthGuard = {
  canActivate: jest.fn(() => true),
};

describe('LinkGroupProjectController', () => {
  let controller: LinkGroupProjectController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinkGroupProjectController],
      providers: [
        {
          provide: LinkGroupProjectService,
          useValue: mockLinkGroupProjectService,
        },
        {
          provide: AuthGuard,
          useValue: mockAuthGuard,
        },
      ],
    }).compile();

    controller = module.get<LinkGroupProjectController>(
      LinkGroupProjectController,
    );

    jest.clearAllMocks();

    mockLinkGroupProjectService.checkPolicies.mockImplementation(
      async (_action, _userSub, _projectId, cb: any) =>
        cb({ project: { id: _projectId } }),
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getAllGroupProjects should call service with groupId', async () => {
    const result = [{ id: 1 }] as any;
    mockLinkGroupProjectService.findAllGroupProjectByUserGroupId.mockResolvedValue(
      result,
    );

    await expect(controller.getAllGroupProjects(1)).resolves.toBe(result);
    expect(
      mockLinkGroupProjectService.findAllGroupProjectByUserGroupId,
    ).toHaveBeenCalledWith(1);
  });

  it('getProjectRelation should call service with projectId', async () => {
    const result = { projectId: 1 } as any;
    mockLinkGroupProjectService.getProjectRelations.mockResolvedValue(result);

    await expect(controller.getProjectRelation(1)).resolves.toBe(result);
    expect(
      mockLinkGroupProjectService.getProjectRelations,
    ).toHaveBeenCalledWith(1);
  });

  it('handleLockProject should call checkPolicies then lockProject', async () => {
    const dto = { projectId: 123, lock: true } as any;
    const request = {
      metadata: { action: ActionType.UPDATE },
      user: { sub: 42 },
    };
    mockLinkGroupProjectService.lockProject.mockResolvedValue('locked');

    const resp = await controller.handleLockProject(dto, request);

    expect(mockLinkGroupProjectService.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      42,
      123,
      expect.any(Function),
    );
    expect(mockLinkGroupProjectService.lockProject).toHaveBeenCalledWith(
      123,
      true,
      42,
    );
    expect(resp).toBe('locked');
  });

  it('update should call updateProject inside checkPolicies', async () => {
    const dto = { project: { id: 5 }, foo: 'bar' } as any;
    const request = {
      metadata: { action: ActionType.UPDATE },
      user: { sub: 42 },
    };
    const result = { linkId: 99 } as any;
    mockLinkGroupProjectService.updateProject.mockResolvedValue(result);

    const resp = await controller.update(dto, request);

    expect(mockLinkGroupProjectService.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      42,
      5,
      expect.any(Function),
    );
    expect(mockLinkGroupProjectService.updateProject).toHaveBeenCalledWith(dto);
    expect(resp).toBe(result);
  });

  it('addProjectToGroup should call service via checkPolicies', async () => {
    const dto = { projectId: 7, groupId: 3 } as any;
    const request = {
      metadata: { action: ActionType.UPDATE },
      user: { sub: 42 },
    };
    const result = [{ id: 1 }] as any;
    mockLinkGroupProjectService.addProjectToGroup.mockResolvedValue(result);

    const resp = await controller.addProjectToGroup(dto, request);

    expect(mockLinkGroupProjectService.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      42,
      7,
      expect.any(Function),
    );
    expect(mockLinkGroupProjectService.addProjectToGroup).toHaveBeenCalledWith(
      dto,
    );
    expect(resp).toBe(result);
  });

  it('updateAccessToProject should call service via checkPolicies', async () => {
    const dto = { projectId: 8, rights: 'READ' } as any;
    const request = {
      metadata: { action: ActionType.UPDATE },
      user: { sub: 42 },
    };
    mockLinkGroupProjectService.updateAccessToProject.mockResolvedValue(
      undefined,
    );

    const resp = await controller.updateAccessToProject(dto, request);

    expect(mockLinkGroupProjectService.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      42,
      8,
      expect.any(Function),
    );
    expect(
      mockLinkGroupProjectService.updateAccessToProject,
    ).toHaveBeenCalledWith(dto, 42);
    expect(resp).toBeUndefined();
  });

  it('deleteProject should call deleteProject via checkPolicies with linkEntity', async () => {
    const projectId = 10;
    const request = {
      metadata: { action: ActionType.DELETE },
      user: { sub: 42 },
    };

    mockLinkGroupProjectService.checkPolicies.mockImplementationOnce(
      async (_action, _userSub, _projectId, cb: any) =>
        cb({ project: { id: projectId } }),
    );
    mockLinkGroupProjectService.deleteProject.mockResolvedValue('deleted');

    const resp = await controller.deleteProject(projectId, request);

    expect(mockLinkGroupProjectService.checkPolicies).toHaveBeenCalledWith(
      ActionType.DELETE,
      42,
      projectId,
      expect.any(Function),
    );
    expect(mockLinkGroupProjectService.deleteProject).toHaveBeenCalledWith(
      projectId,
    );
    expect(resp).toBe('deleted');
  });

  it('deleteGroupProjectLink should call RemoveProjectToGroup via checkPolicies', async () => {
    const projectId = 11;
    const groupId = 2;
    const request = {
      metadata: { action: ActionType.UPDATE },
      user: { sub: 42 },
    };
    mockLinkGroupProjectService.RemoveProjectToGroup.mockResolvedValue(
      'removed',
    );

    const resp = await controller.deleteGroupProjectLink(
      projectId,
      groupId,
      request,
    );

    expect(mockLinkGroupProjectService.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      42,
      projectId,
      expect.any(Function),
    );
    expect(
      mockLinkGroupProjectService.RemoveProjectToGroup,
    ).toHaveBeenCalledWith({ projectId, groupId });
    expect(resp).toBe('removed');
  });

  it('removeProjectFromUser should call service with projectId and user.sub', async () => {
    const projectId = 12;
    const request = { user: { sub: 42 } };
    mockLinkGroupProjectService.removeProjectFromUser.mockResolvedValue('ok');

    const resp = await controller.removeProjectFromUser(projectId, request);

    expect(
      mockLinkGroupProjectService.removeProjectFromUser,
    ).toHaveBeenCalledWith(projectId, 42);
    expect(resp).toBe('ok');
  });

  it('lookingForProject should call searchForUserGroupProjectWithPartialProjectName', () => {
    const result = [{ id: 1 }] as any;
    mockLinkGroupProjectService.searchForUserGroupProjectWithPartialProjectName.mockReturnValue(
      result,
    );

    const resp = controller.lookingForProject('proj', 10);

    expect(resp).toBe(result);
    expect(
      mockLinkGroupProjectService.searchForUserGroupProjectWithPartialProjectName,
    ).toHaveBeenCalledWith('proj', 10);
  });

  it('createProject should delegate to service', () => {
    const dto = { title: 'p1' } as any;
    const result = { id: 1 } as any;
    mockLinkGroupProjectService.createProject.mockReturnValue(result);

    const resp = controller.createProject(dto);

    expect(resp).toBe(result);
    expect(mockLinkGroupProjectService.createProject).toHaveBeenCalledWith(dto);
  });

  it('getAllUsersProjects should return projects when userId matches token sub', async () => {
    const userId = 42;
    const request = { user: { sub: 42 } };
    const result = [{ id: 1 }] as any;
    mockLinkGroupProjectService.findAllUserProjects.mockResolvedValue(result);

    const resp = await controller.getAllUsersProjects(userId, request);

    expect(
      mockLinkGroupProjectService.findAllUserProjects,
    ).toHaveBeenCalledWith(userId);
    expect(resp).toBe(result);
  });

  it('getAllUsersProjects should return UnauthorizedException when userId differs from token sub', async () => {
    const userId = 1;
    const request = { user: { sub: 42 } };

    const resp = await controller.getAllUsersProjects(userId, request);

    expect(resp).toBeInstanceOf(UnauthorizedException);
  });

  it('duplicateProject should call service via checkPolicies', async () => {
    const projectId = 13;
    const request = {
      metadata: { action: ActionType.UPDATE },
      user: { sub: 42 },
    };
    const result = { id: 99 } as any;
    mockLinkGroupProjectService.duplicateProject.mockResolvedValue(result);

    const resp = await controller.duplicateProject(projectId, request);

    expect(mockLinkGroupProjectService.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      42,
      projectId,
      expect.any(Function),
    );
    expect(mockLinkGroupProjectService.duplicateProject).toHaveBeenCalledWith(
      projectId,
      42,
    );
    expect(resp).toBe(result);
  });

  it('generateSnapshot should set creatorId and call service via checkPolicies', async () => {
    const dto: any = { projectId: 14 };
    const request = {
      metadata: { action: ActionType.UPDATE },
      user: { sub: 42 },
    };
    const result = { snapshotId: 1 } as any;
    mockLinkGroupProjectService.generateProjectSnapshot.mockResolvedValue(
      result,
    );

    const resp = await controller.generateSnapshot(dto, request);

    expect(dto.creatorId).toBe(42);
    expect(mockLinkGroupProjectService.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      42,
      14,
      expect.any(Function),
    );
    expect(
      mockLinkGroupProjectService.generateProjectSnapshot,
    ).toHaveBeenCalledWith(dto, 42);
    expect(resp).toBe(result);
  });

  it('updateSnapshot should call service via checkPolicies', async () => {
    const dto: any = {
      title: 'new',
      snapshotId: 5,
      projectId: 15,
    };
    const request = {
      metadata: { action: ActionType.UPDATE },
      user: { sub: 42 },
    };
    const result = 'updated';
    mockLinkGroupProjectService.updateSnapshot.mockResolvedValue(result);

    const resp = await controller.updateSnapshot(dto, request);

    expect(mockLinkGroupProjectService.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      42,
      15,
      expect.any(Function),
    );
    expect(mockLinkGroupProjectService.updateSnapshot).toHaveBeenCalledWith(
      'new',
      5,
      15,
    );
    expect(resp).toBe(result);
  });

  it('deleteSnapshot should call service via checkPolicies', async () => {
    const snapshotId = 5;
    const projectId = 16;
    const request = {
      metadata: { action: ActionType.UPDATE },
      user: { sub: 42 },
    };
    const result = 'deleted';
    mockLinkGroupProjectService.deleteSnapshot.mockResolvedValue(result);

    const resp = await controller.deleteSnapshot(
      snapshotId,
      projectId,
      request,
    );

    expect(mockLinkGroupProjectService.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      42,
      projectId,
      expect.any(Function),
    );
    expect(mockLinkGroupProjectService.deleteSnapshot).toHaveBeenCalledWith(
      snapshotId,
    );
    expect(resp).toBe(result);
  });

  it('isLocked should call service with projectId and user.sub', async () => {
    const projectId = 17;
    const request = { user: { sub: 42 } };
    const result = { locked: true };
    mockLinkGroupProjectService.isProjectLocked.mockResolvedValue(result);

    const resp = await controller.isLocked(projectId, request);

    expect(mockLinkGroupProjectService.isProjectLocked).toHaveBeenCalledWith(
      projectId,
      42,
    );
    expect(resp).toBe(result);
  });
});
