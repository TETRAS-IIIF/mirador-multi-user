import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './Entities/setting.entity';
import { SettingsService } from './setting.service';
import { SettingsController } from './setting.controller';
import { AuthModule } from '../../auth/auth.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Setting]), AuthModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
