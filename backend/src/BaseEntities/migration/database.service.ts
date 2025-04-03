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
}
