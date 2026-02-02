import { forwardRef, Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './Entities/setting.entity';
import { SettingsService } from './setting.service';
import { AuthModule } from '../../auth/auth.module';
import { SettingsController } from './setting.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Setting]), forwardRef(() => AuthModule)],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
