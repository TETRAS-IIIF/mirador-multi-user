import {
  Controller,
  ForbiddenException,
  Post,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { EmailServerService } from './email.service';
import { AuthGuard } from '../../auth/auth.guard';
import { ActionType } from '../../enum/actions';
import { SettingsService } from '../../BaseEntities/setting/setting.service';

@Controller('/email-server')
export class EmailServerController {
  constructor(
    private readonly EmailService: EmailServerService,
    private readonly settingsService: SettingsService,
  ) {}

  @ApiOperation({ summary: 'Send a test email (instance admins only)' })
  @SetMetadata('action', ActionType.ADMIN)
  @UseGuards(AuthGuard)
  @Post('test')
  async testEMail(@Req() request) {
    // Admin status is read from the database, not from the JWT, so a token
    // issued before the user lost admin rights is refused.
    const isAdmin = await this.settingsService.isAdmin(request.user.sub);
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can send test emails');
    }
    return this.EmailService.sendTestMail();
  }
}
