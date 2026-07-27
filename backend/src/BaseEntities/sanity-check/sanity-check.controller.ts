import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { SettingsService } from '../setting/setting.service';
import { SanityCheckService } from './sanity-check.service';

@ApiBearerAuth()
@Controller('sanity-check')
export class SanityCheckController {
  constructor(
    private readonly sanityCheckService: SanityCheckService,
    private readonly settingsService: SettingsService,
  ) {}

  @UseGuards(AuthGuard)
  @Get()
  async runSanityChecks(@Req() request) {
    const isAdmin = await this.settingsService.isAdmin(request.user.sub);
    if (!isAdmin) {
      throw new UnauthorizedException('You are not allowed to do this');
    }
    return this.sanityCheckService.runAll();
  }
}
