import { Controller, Post } from '@nestjs/common';
import { EmailServerService } from './email.service';

@Controller('/email-server')
export class EmailServerController {
  constructor(private readonly EmailService: EmailServerService) {}

  @Post('test')
  testEMail() {
    return this.EmailService.sendTestMail();
  }
}
