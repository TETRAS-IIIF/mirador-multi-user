import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

import { SettingsController } from './setting.controller';
import { SettingsService } from './setting.service';
import { SetSettingDto } from './dto/setSetting.dto';
import { AuthGuard } from '../../auth/auth.guard'; // <- import your guard

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: jest.Mocked<SettingsService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<SettingsService>> = {
      getAll: jest.fn(),
      isAdmin: jest.fn(),
      set: jest.fn(),
      getLogs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: serviceMock,
        },
        {
          provide: AuthGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
      ],
    }).compile();

    controller = module.get(SettingsController);
    service = module.get(SettingsService) as jest.Mocked<SettingsService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getSetting() returns SettingsService.getAll()', async () => {
    const settings = [{ key: 'LOG_LEVEL', value: 'debug' }];
    service.getAll.mockResolvedValue(settings as any);

    const result = await controller.getSetting();

    expect(service.getAll).toHaveBeenCalled();
    expect(result).toBe(settings);
  });

  it('setSetting() updates setting when user is admin', async () => {
    const body: SetSettingDto = { key: 'LOG_LEVEL', value: 'info' } as any;
    const req = { user: { sub: 1 } } as any;

    service.isAdmin.mockResolvedValue(true);
    service.set.mockResolvedValue(undefined);

    const result = await controller.setSetting(body, req);

    expect(service.isAdmin).toHaveBeenCalledWith(1);
    expect(service.set).toHaveBeenCalledWith('LOG_LEVEL', 'info');
    expect(result).toEqual({ message: 'Setting updated successfully' });
  });

  it('setSetting() returns UnauthorizedException when user is not admin', async () => {
    const body: SetSettingDto = { key: 'LOG_LEVEL', value: 'info' } as any;
    const req = { user: { sub: 2 } } as any;

    service.isAdmin.mockResolvedValue(false);

    const result = await controller.setSetting(body, req);

    expect(service.isAdmin).toHaveBeenCalledWith(2);
    expect(result).toBeInstanceOf(UnauthorizedException);
  });

  it('getLogs() returns logs when user is admin', async () => {
    const req = { user: { sub: 1 } } as any;
    const logs = ['log1', 'log2'];

    service.isAdmin.mockResolvedValue(true);
    service.getLogs.mockResolvedValue(logs as any);

    const result = await controller.getLogs(req);

    expect(service.isAdmin).toHaveBeenCalledWith(1);
    expect(service.getLogs).toHaveBeenCalled();
    expect(result).toBe(logs);
  });

  it('getLogs() returns UnauthorizedException when user is not admin', async () => {
    const req = { user: { sub: 2 } } as any;

    service.isAdmin.mockResolvedValue(false);

    const result = await controller.getLogs(req);

    expect(service.isAdmin).toHaveBeenCalledWith(2);
    expect(result).toBeInstanceOf(UnauthorizedException);
  });
});
