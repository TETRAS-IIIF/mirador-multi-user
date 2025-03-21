import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SettingsService } from './setting.service';
import { SetSettingDto } from './dto/setSetting.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':key')
  async getSetting(@Param('key') key: string) {
    return { key, value: await this.settingsService.get(key) };
  }

  @Post()
  async setSetting(@Body() body: SetSettingDto) {
    await this.settingsService.set(body.key, body.value);
    return { message: 'Setting updated successfully' };
  }
}
