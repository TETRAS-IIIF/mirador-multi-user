import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { Setting } from './Entities/setting.entity';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';
import { requiredSettings } from './utils.setting';

@Injectable()
export class SettingsService implements OnModuleInit {
  private redis: Redis;
  private readonly logger = new CustomLogger();

  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepository: Repository<Setting>,
  ) {
    this.redis = new Redis();
  }

  async onModuleInit() {
    try {
      const existingSettings = await this.settingsRepository.find();

      const existingKeys = new Set(
        existingSettings.map((setting) => setting.key),
      );

      for (const [key, defaultValue] of Object.entries(requiredSettings)) {
        if (!existingKeys.has(key)) {
          await this.settingsRepository.save({ key, value: defaultValue });
        }
      }

      const updatedSettings = await this.settingsRepository.find();
      for (const setting of updatedSettings) {
        await this.redis.set(setting.key, setting.value);
      }
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while initializing the settings',
        error,
      );
    }
  }

  async get(key: string) {
    try {
      const cachedValue = await this.redis.get(key);
      if (cachedValue) return cachedValue;

      const setting = await this.settingsRepository.findOne({ where: { key } });
      if (setting) {
        await this.redis.set(key, setting.value);
        return setting.value;
      }
      return null;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while getting setting : ${key}`,
        error,
      );
    }
  }

  async set(key: string, value: string) {
    try {
      await this.redis.set(key, value);

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
      await this.redis.del(key);
      await this.settingsRepository.delete({ key });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while deleting settings: ${key}`,
        error,
      );
    }
  }
}
