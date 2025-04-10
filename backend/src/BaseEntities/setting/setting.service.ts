import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './Entities/setting.entity';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';
import {
  parseHumanSizeToMB,
  requiredSettings,
  SettingKeys,
  unMutableSettings,
} from './utils.setting';
import { AuthService } from '../../auth/auth.service';
import { DatabaseService } from '../database/database.service';
import { UPLOAD_FOLDER } from '../../utils/constants';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new CustomLogger();
  private readonly appStartedAt = new Date().toISOString();

  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepository: Repository<Setting>,
    private readonly authService: AuthService,
    private readonly databaseService: DatabaseService,
  ) {}

  async onModuleInit() {
    try {
      await this.syncSettingsWithEnv(requiredSettings);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while initializing the settings',
        error,
      );
    }
  }

  private shouldCreate(
    existing: { value: string; isKeyMutable?: boolean } | undefined,
  ) {
    if (!existing) return true;
  }

  async syncSettingsWithEnv(requiredSettings: Record<string, any>) {
    const existingSettings = await this.settingsRepository.find();

    const existingMap = new Map(
      existingSettings.map((setting) => [setting.key, setting]),
    );

    for (const [key, envValue] of Object.entries(requiredSettings)) {
      const existing = existingMap.get(key);
      if (this.shouldCreate(existing)) {
        await this.set(key, envValue);
        this.logger.log(`New setting: ${key} = ${envValue}`);
      }
    }
  }

  async getUploadFolderSize(): Promise<string> {
    try {
      const { stdout } = await execAsync(`du -hs "${UPLOAD_FOLDER}"`, {
        encoding: 'utf-8',
      });
      const [sizeHuman] = stdout.trim().split(/\s+/);
      const sizeMB = parseHumanSizeToMB(sizeHuman);

      return `${sizeMB.toFixed(2)}`;
    } catch (err) {
      this.logger.error('Error executing df -h for folder:', err.message);
      return 'Error retrieving disk usage';
    }
  }

  async getAll() {
    try {
      const settings = await this.settingsRepository.find();
      const privateSettings = [...unMutableSettings];
      const lastMigration = await this.databaseService.getLastMigrationDate();
      const uploadFileSize = await this.getUploadFolderSize();
      const dbSize = await this.databaseService.getDatabaseSizeMB();
      privateSettings.push(
        ['LAST_MIGRATION', lastMigration?.toISOString() ?? null],
        ['UPLOAD_FOLDER_SIZE', uploadFileSize],
        ['DB_SIZE', dbSize],
        ['LAST_STARTING_TIME', this.appStartedAt],
      );
      return {
        mutableSettings: settings,
        unMutableSettings: privateSettings,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while getting settings}`,
        error,
      );
    }
  }

  async set(key: string, value: string) {
    try {
      let setting = await this.settingsRepository.findOne({ where: { key } });
      if (setting) {
        setting.value = value;
      } else {
        setting = this.settingsRepository.create({ key, value });
      }
      return await this.settingsRepository.save(setting);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while trying to set: ${key}, ${value}`,
        error,
      );
    }
  }

  async delete(key: string) {
    try {
      await this.settingsRepository.delete({ key });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while deleting settings: ${key}`,
        error,
      );
    }
  }

  async isAdmin(userId: number) {
    try {
      const user = await this.authService.findProfile(userId);
      return user._isAdmin;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while checking admin rights of user with id: ${userId}`,
        error,
      );
    }
  }

  async get(key: SettingKeys) {
    try {
      const dbSetting = await this.settingsRepository.findOne({
        where: { key },
      });
      return dbSetting?.value ?? unMutableSettings.get(key) ?? null;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while finding setting with key: ${key}`,
        error,
      );
    }
  }
}
