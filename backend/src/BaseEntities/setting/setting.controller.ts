import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './setting.service';
import { SetSettingDto } from './dto/setSetting.dto';
import { AuthGuard } from '../../auth/auth.guard';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @UseGuards(AuthGuard)
  @Get(':key')
  async getSetting(@Param('key') key: string, @Req() request) {
    const isAdmin = await this.settingsService.isAdmin(request.user.sub);
    if (isAdmin) {
      return { key, value: await this.settingsService.get(key) };
    } else {
      return new UnauthorizedException('you are not allowed to do this');
    }
  }

  @UseGuards(AuthGuard)
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
}
