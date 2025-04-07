import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './Entities/setting.entity';
import { SettingsService } from './setting.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Setting]), AuthModule],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
