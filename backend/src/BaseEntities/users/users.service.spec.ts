import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<User>>> = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Optional: example of a simple behavior test
  it('findOne calls repository with id', async () => {
    const user = { id: 1, mail: 'a@b.c' } as User;
    repo.findOne.mockResolvedValue(user);

    const result = await service.findOne(1);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toBe(user);
  });
});
