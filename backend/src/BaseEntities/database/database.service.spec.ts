import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const dataSourceMock: Partial<jest.Mocked<DataSource>> = {
      query: jest.fn(),
      options: {
        database: 'test_db',
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get(DatabaseService);
    dataSource = module.get(DataSource) as jest.Mocked<DataSource>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getLastMigrationDate() returns last migration date when row exists', async () => {
    (dataSource.query as jest.Mock).mockResolvedValue([
      { timestamp: '1731580800000' }, // 2024-11-14T00:00:00.000Z for example
    ]);

    const result = await service.getLastMigrationDate();

    expect(dataSource.query).toHaveBeenCalledWith(
      'SELECT * FROM `migrations` ORDER BY `timestamp` DESC LIMIT 1',
    );
    expect(result).toBeInstanceOf(Date);
  });

  it('getLastMigrationDate() returns null when no rows', async () => {
    (dataSource.query as jest.Mock).mockResolvedValue([]);

    const result = await service.getLastMigrationDate();

    expect(result).toBeNull();
  });

  it('getDatabaseSizeMB() returns size when row exists', async () => {
    (dataSource.query as jest.Mock).mockResolvedValue([{ size_mb: 12.34 }]);

    const result = await service.getDatabaseSizeMB();

    expect(dataSource.query).toHaveBeenCalledWith(
      `
          SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
          FROM information_schema.tables
          WHERE table_schema = ?
          GROUP BY table_schema
      `,
      ['test_db'],
    );
    expect(result).toBe('12.34 MB');
  });

  it('getDatabaseSizeMB() returns null when no rows', async () => {
    (dataSource.query as jest.Mock).mockResolvedValue([]);

    const result = await service.getDatabaseSizeMB();

    expect(result).toBeNull();
  });
});
