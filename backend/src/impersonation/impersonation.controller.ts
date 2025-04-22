import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ImpersonationService } from './impersonation.service';
import { AuthGuard } from '@nestjs/passport';
import { ImpersonateDto } from './dto/impersonateDto';

@Controller('impersonation')
export class ImpersonationController {
  constructor(private readonly impersonationService: ImpersonationService) {}

  @UseGuards(AuthGuard('jwt'))
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

  @UseGuards(AuthGuard('jwt'))
  @Post('/impersonate')
  async impersonate(@Body() impersonateDto: ImpersonateDto) {
    return this.impersonationService.impersonateUserData(impersonateDto);
  }
}
