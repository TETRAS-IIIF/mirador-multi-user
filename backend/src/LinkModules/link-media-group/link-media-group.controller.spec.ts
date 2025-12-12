jest.mock('../../auth/auth.guard', () => ({
  AuthGuard: class {
    canActivate() {
      return true;
    }
  },
}));

jest.mock('./link-media-group.service', () => {
  class LinkMediaGroupServiceMock {
    createMedia = jest.fn();
    getAllMediasForUser = jest.fn();
    getAllMediaGroup = jest.fn();
    checkPolicies = jest.fn();
    removeMedia = jest.fn();
    updateMedia = jest.fn();
    updateMediaGroupRelation = jest.fn();
    addMediaToGroup = jest.fn();
    removeAccessToMedia = jest.fn();
    removeMediaFromUser = jest.fn();
  }

  return { LinkMediaGroupService: LinkMediaGroupServiceMock };
});

jest.mock('../../utils/Custom_pipes/sharp.pipe', () => ({
  SharpPipeInterceptor: class {
    intercept(_context, next) {
      return next.handle();
    }
  },
}));

jest.mock('../../utils/Custom_pipes/media-link.pipe', () => ({
  MediaLinkInterceptor: class {
    intercept(_context, next) {
      return next.handle();
    }
  },
}));

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    mkdirSync: jest.fn(),
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { LinkMediaGroupController } from './link-media-group.controller';
import { LinkMediaGroupService } from './link-media-group.service';
import { SettingsService } from '../../BaseEntities/setting/setting.service';
import { AuthGuard } from '../../auth/auth.guard';
import { SettingKeys } from '../../BaseEntities/setting/utils.setting';
import { UpdateMediaDto } from '../../BaseEntities/media/dto/update-media.dto';
import { UpdateMediaGroupRelationDto } from './dto/updateMediaGroupRelationDto';
import { AddMediaToGroupDto } from './dto/addMediaToGroupDto';
import { ActionType } from '../../enum/actions';

describe('LinkMediaGroupController', () => {
  let controller: LinkMediaGroupController;
  let service: jest.Mocked<LinkMediaGroupService>;
  let settingsService: jest.Mocked<SettingsService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<LinkMediaGroupService>> = {
      createMedia: jest.fn(),
      getAllMediasForUser: jest.fn(),
      getAllMediaGroup: jest.fn(),
      checkPolicies: jest.fn(),
      removeMedia: jest.fn(),
      updateMedia: jest.fn(),
      updateMediaGroupRelation: jest.fn(),
      addMediaToGroup: jest.fn(),
      removeAccessToMedia: jest.fn(),
      removeMediaFromUser: jest.fn(),
    };

    const settingsMock: Partial<jest.Mocked<SettingsService>> = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinkMediaGroupController],
      providers: [
        {
          provide: LinkMediaGroupService,
          useValue: serviceMock,
        },
        {
          provide: SettingsService,
          useValue: settingsMock,
        },
        // Stub AuthGuard so Nest doesn't try to build the real one
        {
          provide: AuthGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
      ],
    }).compile();

    controller = module.get(LinkMediaGroupController);
    service = module.get(
      LinkMediaGroupService,
    ) as jest.Mocked<LinkMediaGroupService>;
    settingsService = module.get(
      SettingsService,
    ) as jest.Mocked<SettingsService>;

    // Default: checkPolicies just executes the callback and returns its result
    service.checkPolicies.mockImplementation(
      async (_action, _userId, _mediaId, cb: () => Promise<any>) => cb(),
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uploadSingleFile() rejects when file size > MAX_UPLOAD_SIZE', async () => {
    // 1 MB limit
    settingsService.get.mockResolvedValue('1');

    const file = { size: 2 * 1024 * 1024, originalname: 'big.png' } as any;
    const body = {
      user_group: JSON.stringify({ id: 1 }),
      description: 'desc',
      idCreator: 123,
    } as any;
    const req = { generatedHash: 'hash', fileType: 'image' } as any;

    await expect(
      controller.uploadSingleFile(file, body, req),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(service.createMedia).not.toHaveBeenCalled();
  });

  it('uploadSingleFile() creates media when file size <= MAX_UPLOAD_SIZE', async () => {
    // 1 MB limit
    settingsService.get.mockResolvedValue('1');

    const file = {
      size: 512 * 1024,
      originalname: 'image.png',
      filename: 'image.png',
    } as any;
    const body = {
      user_group: JSON.stringify({ id: 1 }),
      description: undefined,
      idCreator: 123,
    } as any;
    const req = { generatedHash: 'hash123', fileType: 'image' } as any;

    const created = { id: 42 };
    service.createMedia.mockResolvedValue(created as any);

    const result = await controller.uploadSingleFile(file, body, req);

    expect(settingsService.get).toHaveBeenCalledWith(
      SettingKeys.MAX_UPLOAD_SIZE,
    );
    expect(service.createMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'image.png',
        description: 'your media description',
        user_group: { id: 1 },
        path: 'image.png',
        hash: 'hash123',
      }),
    );
    expect(result).toBe(created);
  });

  it('reuploadFile() throws when size > MAX_UPLOAD_SIZE', async () => {
    settingsService.get.mockResolvedValue('1'); // 1 MB

    const file = { size: 2 * 1024 * 1024 } as any;

    await expect(controller.reuploadFile(file)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('reuploadFile() resolves when size <= MAX_UPLOAD_SIZE', async () => {
    settingsService.get.mockResolvedValue('1'); // 1 MB

    const file = { size: 512 * 1024 } as any;

    await expect(controller.reuploadFile(file)).resolves.toBeUndefined();
  });

  it('getUserMedias() forwards user.sub to service', async () => {
    const req = { user: { sub: 10 } } as any;
    const medias = [{ id: 1 }];
    service.getAllMediasForUser.mockResolvedValue(medias as any);

    const result = await controller.getUserMedias(req);

    expect(service.getAllMediasForUser).toHaveBeenCalledWith(10);
    expect(result).toBe(medias);
  });

  it('getMediaById() forwards mediaId to service', async () => {
    const mediaId = 5;
    const groups = [{ id: 1 }];
    service.getAllMediaGroup.mockResolvedValue(groups as any);

    const result = await controller.getMediaById(mediaId as any);

    expect(service.getAllMediaGroup).toHaveBeenCalledWith(mediaId);
    expect(result).toBe(groups);
  });

  it('deleteMedia() passes through checkPolicies and removeMedia', async () => {
    const mediaId = 7;
    const req = {
      user: { sub: 1 },
      metadata: { action: ActionType.DELETE },
    } as any;
    const removed = { success: true };
    service.removeMedia.mockResolvedValue(removed as any);

    const result = await controller.deleteMedia(mediaId as any, req);

    expect(service.checkPolicies).toHaveBeenCalledWith(
      ActionType.DELETE,
      1,
      mediaId,
      expect.any(Function),
    );
    expect(service.removeMedia).toHaveBeenCalledWith(mediaId);
    expect(result).toBe(removed);
  });

  it('updateMedia() passes through checkPolicies and updateMedia', async () => {
    const dto: UpdateMediaDto = { id: 3 } as any;
    const req = {
      user: { sub: 2 },
      metadata: { action: ActionType.UPDATE },
    } as any;
    const updated = { id: 3, title: 'updated' };
    service.updateMedia.mockResolvedValue(updated as any);

    const result = await controller.updateMedia(dto, req);

    expect(service.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      2,
      dto.id,
      expect.any(Function),
    );
    expect(service.updateMedia).toHaveBeenCalledWith(dto);
    expect(result).toBe(updated);
  });

  it('updateMediaGroupRelation() passes through checkPolicies and updateMediaGroupRelation', async () => {
    const body: UpdateMediaGroupRelationDto = {
      mediaId: 9,
      userGroupId: 4,
      rights: 'ADMIN' as any,
    };
    const req = {
      user: { sub: 3 },
      metadata: { action: ActionType.UPDATE },
    } as any;
    const updated = { ok: true };
    service.updateMediaGroupRelation.mockResolvedValue(updated as any);

    const result = await controller.updateMediaGroupRelation(body, req);

    expect(service.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      3,
      body.mediaId,
      expect.any(Function),
    );
    expect(service.updateMediaGroupRelation).toHaveBeenCalledWith(
      body.mediaId,
      body.userGroupId,
      body.rights,
      3,
    );
    expect(result).toBe(updated);
  });

  it('addMediaToGroup() forwards dto', async () => {
    const dto: AddMediaToGroupDto = {
      mediasId: [1],
      userGroupId: 2,
      rights: 'READER' as any,
    };
    const list = [{ id: 1 }];
    service.addMediaToGroup.mockResolvedValue(list as any);

    const result = await controller.addMediaToGroup(dto);

    expect(service.addMediaToGroup).toHaveBeenCalledWith(dto);
    expect(result).toBe(list);
  });

  it('deleteMediaById() passes through checkPolicies and removeAccessToMedia', async () => {
    const mediaId = 8;
    const groupId = 4;
    const req = {
      user: { sub: 5 },
      metadata: { action: ActionType.UPDATE },
    } as any;
    const removed = { done: true };
    service.removeAccessToMedia.mockResolvedValue(removed as any);

    const result = await controller.deleteMediaById(
      mediaId as any,
      groupId as any,
      req,
    );

    expect(service.checkPolicies).toHaveBeenCalledWith(
      ActionType.UPDATE,
      5,
      mediaId,
      expect.any(Function),
    );
    expect(service.removeAccessToMedia).toHaveBeenCalledWith(mediaId, groupId);
    expect(result).toBe(removed);
  });

  it('removeMediaFromUser() forwards mediaId and user.sub', async () => {
    const mediaId = 11;
    const req = { user: { sub: 6 } } as any;
    const resVal = { removed: true };

    service.removeMediaFromUser.mockResolvedValue(resVal as any);

    const result = await controller.removeMediaFromUser(mediaId as any, req);

    expect(service.removeMediaFromUser).toHaveBeenCalledWith(mediaId, 6);
    expect(result).toBe(resVal);
  });
});
