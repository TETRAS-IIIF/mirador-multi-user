import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(private dataSource: DataSource) {}

  async getLastMigrationDate(): Promise<Date | null> {
    const result = await this.dataSource.query(
      'SELECT * FROM `migrations` ORDER BY `timestamp` DESC LIMIT 1',
    );
    const timestamp = result[0]?.timestamp;
    return timestamp ? new Date(Number(timestamp)) : null;
  }

  async getDatabaseSizeMB(): Promise<string | null> {
    const dbName = this.dataSource.options.database;

    const result = await this.dataSource.query(
      `
          SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
          FROM information_schema.tables
          WHERE table_schema = ?
          GROUP BY table_schema
      `,
      [dbName],
    );

    return result[0]?.size_mb ? `${result[0].size_mb} MB` : null;
  }
}
