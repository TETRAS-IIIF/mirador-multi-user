import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SettingsService } from './setting.service';
import { Setting } from './Entities/setting.entity';
import { AuthService } from '../../auth/auth.service';
import { DatabaseService } from '../database/database.service';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<Setting>>> = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const authServiceMock: Partial<jest.Mocked<AuthService>> = {
      findProfile: jest.fn(),
    };

    const dbServiceMock: Partial<jest.Mocked<DatabaseService>> = {
      getLastMigrationDate: jest.fn(),
      getDatabaseSizeMB: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: getRepositoryToken(Setting),
          useValue: repoMock,
        },
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: DatabaseService,
          useValue: dbServiceMock,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
