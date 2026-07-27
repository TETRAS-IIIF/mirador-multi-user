import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';

export interface SanityCheckResult {
  key: string;
  passed: boolean;
  details?: string;
}

@Injectable()
export class SanityCheckService {
  private readonly logger = new CustomLogger();

  constructor(private readonly dataSource: DataSource) {}

  async runAll(): Promise<SanityCheckResult[]> {
    return Promise.all([this.checkUsersHavePersonalGroup()]);
  }

  private async checkUsersHavePersonalGroup(): Promise<SanityCheckResult> {
    const key = 'USER_PERSONAL_GROUP';
    try {
      const usersWithoutPersonalGroup = await this.dataSource.query(`
        SELECT u.id, u.mail
        FROM \`user\` u
        WHERE NOT EXISTS (
          SELECT 1
          FROM \`link_user_group\` lug
          INNER JOIN \`user_group\` ug ON ug.id = lug.user_group
          WHERE lug.user_id = u.id AND ug.type = 'personal'
        )
      `);
      const passed = usersWithoutPersonalGroup.length === 0;
      return {
        key,
        passed,
        details: passed
          ? undefined
          : `${usersWithoutPersonalGroup.length} user(s) without a personal group: ${usersWithoutPersonalGroup
              .map((user) => user.mail)
              .join(', ')}`,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        key,
        passed: false,
        details: `Check failed to run: ${error.message}`,
      };
    }
  }
}
