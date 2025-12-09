import { Test, TestingModule } from '@nestjs/testing';
import { LinkManifestGroupController } from './link-manifest-group.controller';
import { LinkManifestGroupService } from './link-manifest-group.service';
import { ActionType } from '../../enum/actions';
import { ManifestGroupRights } from '../../enum/rights';
import { manifestOrigin } from '../../enum/origins';

describe('LinkManifestGroupController', () => {
  let controller: LinkManifestGroupController;
  let service: jest.Mocked<LinkManifestGroupService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<LinkManifestGroupService>> = {
      findAllManifestByUserId: jest.fn(),
      createManifest: jest.fn(),
      updateManifestJson: jest.fn(),
      getAllManifestsGroup: jest.fn(),
      checkPolicies: jest.fn(),
      removeManifest: jest.fn(),
      updateManifest: jest.fn(),
      updateAccessToManifest: jest.fn(),
      addManifestToGroup: jest.fn(),
      removeAccessToManifest: jest.fn(),
      removeManifestFromUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinkManifestGroupController],
      providers: [
        {
          provide: LinkManifestGroupService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get(LinkManifestGroupController);
    service = module.get(
      LinkManifestGroupService,
    ) as jest.Mocked<LinkManifestGroupService>;

    // Default behaviour for checkPolicies: execute callback
    service.checkPolicies.mockImplementation(
      async (_action, _userId, _manifestId, cb: () => Promise<any>) => cb(),
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getManifestByUserId() calls findAllManifestByUserId with request.user.sub', async () => {
    const req = { user: { sub: 123 } } as any;
    const manifests = [{ id: 1 }, { id: 2 }];

    service.findAllManifestByUserId.mockResolvedValue(manifests as any);

    const result = await controller.getManifestByUserId(req);

    expect(service.findAllManifestByUserId).toHaveBeenCalledWith(123);
    expect(result).toBe(manifests);
  });

  it('linkManifest() builds manifestToCreate and calls createManifest', async () => {
    const dto = {
      idCreator: 10,
      hash: 'hash',
      path: 'path',
      rights: ManifestGroupRights.ADMIN,
      groupId: 5,
      title: 'My manifest',
    } as any;

    const created = { id: 1 };
    service.createManifest.mockResolvedValue(created as any);

    const result = await controller.linkManifest(dto);

    expect(service.createManifest).toHaveBeenCalledWith({
      ...dto,
      description: 'your manifest description',
      origin: manifestOrigin.LINK,
    });
    expect(result).toBe(created);
  });

  it('UpdateManifest() forwards dto to updateManifestJson', async () => {
    const updateDto = {
      id: 1,
      manifestJson: { foo: 'bar' },
    } as any;

    const updated = { id: 1, manifestJson: { foo: 'bar' } };
    service.updateManifestJson.mockResolvedValue(updated as any);

    const result = await controller.UpdateManifest(updateDto);

    expect(service.updateManifestJson).toHaveBeenCalledWith(updateDto);
    expect(result).toBe(updated);
  });

  it('getManifestById() forwards manifestId to getAllManifestsGroup', async () => {
    const manifestId = 42;
    const groups = [{ id: 1 }, { id: 2 }];

    service.getAllManifestsGroup.mockResolvedValue(groups as any);

    const result = await controller.getManifestById(manifestId as any);

    expect(service.getAllManifestsGroup).toHaveBeenCalledWith(manifestId);
    expect(result).toBe(groups);
  });

  it('deleteManifest() calls checkPolicies then removeManifest with manifestId', async () => {
    const manifestId = 7;
    const req = {
      user: { sub: 99 },
      metadata: { action: ActionType.DELETE },
    } as any;
    const removed = { success: true };

    service.removeManifest.mockResolvedValue(removed as any);

    const result = await controller.deleteManifest(manifestId as any, req);

    expect(service.checkPolicies).toHaveBeenCalledWith(
      ActionType.DELETE,
      99,
      manifestId,
      expect.any(Function),
    );
    expect(service.removeManifest).toHaveBeenCalledWith(manifestId);
    expect(result).toBe(removed);
  });

  it('updateManifest() calls checkPolicies then updateManifest with dto', async () => {
    const updateDto = { id: 3, title: 'updated' } as any;
    const req = {
      user: { sub: 5 },
      metadata: { action: ActionType.UPDATE },
    } as any;
    const updated = { id: 3, title: 'updated' };

    service.updateManifest.mockResolvedValue(updated as any);

    const result = await controller.updateManifest(updateDto, req);

    expect(service.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      5,
      updateDto.id,
      expect.any(Function),
    );
    expect(service.updateManifest).toHaveBeenCalledWith(updateDto);
    expect(result).toBe(updated);
  });

  it('updateManifestGroupRelation() calls checkPolicies then updateAccessToManifest', async () => {
    const body = {
      manifestId: 8,
      userGroupId: 2,
      rights: ManifestGroupRights.EDITOR,
    } as any;
    const req = {
      user: { sub: 11 },
      metadata: { action: ActionType.UPDATE },
    } as any;
    const updated = { ok: true };

    service.updateAccessToManifest.mockResolvedValue(updated as any);

    const result = await controller.updateManifestGroupRelation(body, req);

    expect(service.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      11,
      body.manifestId,
      expect.any(Function),
    );
    expect(service.updateAccessToManifest).toHaveBeenCalledWith(
      {
        manifestId: body.manifestId,
        userGroupId: body.userGroupId,
        rights: body.rights,
      },
      11,
    );
    expect(result).toBe(updated);
  });

  it('addManifestToGroup() forwards dto to addManifestToGroup', async () => {
    const dto = {
      manifestId: 1,
      groupId: 2,
      rights: ManifestGroupRights.READER,
    } as any;
    const links = [{ id: 1 }];

    service.addManifestToGroup.mockResolvedValue(links as any);

    const result = await controller.addManifestToGroup(dto);

    expect(service.addManifestToGroup).toHaveBeenCalledWith(dto);
    expect(result).toBe(links);
  });

  it('removeManifestGroupLink() calls checkPolicies then removeAccessToManifest', async () => {
    const manifestId = 9;
    const groupId = 4;
    const req = {
      user: { sub: 22 },
      metadata: { action: ActionType.UPDATE },
    } as any;
    const removed = { done: true };

    service.removeAccessToManifest.mockResolvedValue(removed as any);

    const result = await controller.removeManifestGroupLink(
      manifestId as any,
      groupId as any,
      req,
    );

    expect(service.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      22,
      manifestId,
      expect.any(Function),
    );
    expect(service.removeAccessToManifest).toHaveBeenCalledWith(
      manifestId,
      groupId,
    );
    expect(result).toBe(removed);
  });

  it('removeManifestFromUser() forwards manifestId and user.sub', async () => {
    const manifestId = 13;
    const req = { user: { sub: 55 } } as any;
    const resultValue = { removed: true };

    service.removeManifestFromUser.mockResolvedValue(resultValue as any);

    const result = await controller.removeManifestFromUser(
      manifestId as any,
      req,
    );

    expect(service.removeManifestFromUser).toHaveBeenCalledWith(manifestId, 55);
    expect(result).toBe(resultValue);
  });
});
