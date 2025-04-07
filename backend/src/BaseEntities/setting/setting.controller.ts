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
import { AuthGuard } from '../../auth/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @UseGuards(AuthGuard)
  @Get()
  async getSetting(@Req() request) {
    console.log('getter setting');
    const isAdmin = await this.settingsService.isAdmin(request.user.sub);
    console.log(isAdmin);
    if (isAdmin) {
      return await this.settingsService.getAll();
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
