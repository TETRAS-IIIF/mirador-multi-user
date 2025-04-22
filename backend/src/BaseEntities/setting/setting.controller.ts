import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { SettingsService } from './setting.service';
import { SetSettingDto } from './dto/setSetting.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../auth/dynamicAuth.guard';

@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get()
  async getSetting() {
    console.log('settings controller called');
    return await this.settingsService.getAll();
  }

  @Post()
  async setSetting(@Body() body: SetSettingDto, @Req() request) {
    const isAdmin = await this.settingsService.isAdmin(request.user.sub);
    if (isAdmin) {
      await this.settingsService.set(body.key, body.value);
      return { message: 'Setting updated successfully' };
    } else {
      return new UnauthorizedException('You are not allowed to do this');
    }
  }

  @Get('logs')
  async getLogs(@Req() request) {
    const isAdmin = await this.settingsService.isAdmin(request.user.sub);
    if (isAdmin) {
      return this.settingsService.getLogs();
    } else {
      return new UnauthorizedException('You are not allowed to do this');
    }
  }
}
