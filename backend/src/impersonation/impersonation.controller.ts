import { Body, Controller, Param, Post, Req, Res } from '@nestjs/common';
import { ImpersonationService } from './impersonation.service';
import { ImpersonateDto } from './dto/impersonateDto';

@Controller('impersonation')
export class ImpersonationController {
  constructor(private readonly impersonationService: ImpersonationService) {}

  @Post(':id/impersonate')
  async impersonateUser(@Param('id') userId: number, @Req() req, @Res() res) {
    const adminUserId = req.user.sub;
    const impersonation = await this.impersonationService.initiateImpersonation(
      adminUserId,
      userId,
    );

    const redirectUrl = `${process.env.FRONTEND_URL}/impersonate/?token=${impersonation.token}`;

    return res.json({ redirectUrl: redirectUrl, user: impersonation.user });
  }

  @Post('/impersonate')
  async impersonate(@Body() impersonateDto: ImpersonateDto) {
    return this.impersonationService.impersonateUserData(impersonateDto);
  }
}
