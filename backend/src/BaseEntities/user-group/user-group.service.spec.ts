import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserGroupService } from './user-group.service';
import { UserGroup } from './entities/user-group.entity';

describe('UserGroupService', () => {
  let service: UserGroupService;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<UserGroup>>> = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserGroupService,
        {
          provide: getRepositoryToken(UserGroup),
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<UserGroupService>(UserGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
