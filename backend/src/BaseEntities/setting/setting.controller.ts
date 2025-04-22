import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './setting.service';
import { SetSettingDto } from './dto/setSetting.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSetting() {
    return await this.settingsService.getAll();
  }

  @UseGuards(AuthGuard('jwt'))
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

  @UseGuards(AuthGuard('jwt'))
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
