import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './Entities/setting.entity';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';
import { requiredSettings, unMutableSettings } from './utils.setting';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new CustomLogger();

  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepository: Repository<Setting>,
    private readonly authService: AuthService,
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

  private shouldUpdate(
    existing: { value: string; isKeyMutable?: boolean } | undefined,
    newValue: string,
  ) {
    if (!existing) return true;
    if (existing.value === newValue) return false;
  }

  async syncSettingsWithEnv(requiredSettings: Record<string, any>) {
    const existingSettings = await this.settingsRepository.find();
    const existingMap = new Map(
      existingSettings.map((setting) => [setting.key, setting]),
    );

    for (const [key, envValue] of Object.entries(requiredSettings)) {
      const existing = existingMap.get(key);
      if (this.shouldUpdate(existing, envValue)) {
        await this.set(key, envValue);
        console.info('New setting :', key, envValue);
      }
    }
    await this.set('LAST_STARTING_TIME', new Date().toISOString());
  }

  async getAll() {
    try {
      const settings = await this.settingsRepository.find();
      const privateSettings = Object.keys(unMutableSettings);
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

      await this.settingsRepository.save(setting);
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
      if (user._isAdmin) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while checking admin rights of user with id: ${userId}`,
        error,
      );
    }
  }
}
