import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * After the migrations ran (at startup), warns when the database still
   * differs from the code: an existing instance that was not synced, or a
   * schema change committed without its migration.
   */
  async onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'test') return;
    try {
      const differences = await this.schemaDifferences();
      if (differences.length > 0) {
        this.logger.warn(
          `The database schema differs from the code (${differences.length} change(s) needed). ` +
            'Run `just migration check` to see them, and `just migration sync` on an existing instance.',
        );
      }
    } catch (error) {
      this.logger.warn(`Could not compare the database schema: ${error}`);
    }
  }

  /** SQL TypeORM would run to make the database match the entities. */
  async schemaDifferences(): Promise<string[]> {
    const sql = await this.dataSource.driver.createSchemaBuilder().log();
    return sql.upQueries.map((q) => q.query);
  }

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
