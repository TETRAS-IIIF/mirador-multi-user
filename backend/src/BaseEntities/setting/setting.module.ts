import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './Entities/setting.entity';
import { SettingsService } from './setting.service';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
