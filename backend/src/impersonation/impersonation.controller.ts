import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ImpersonationService } from './impersonation.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ImpersonateDto } from './dto/impersonateDto';

@ApiBearerAuth()
@Controller('auth/impersonate')
export class ImpersonationController {
  constructor(private readonly impersonationService: ImpersonationService) {}

  @ApiOperation({
    summary: 'Admin initiates impersonation, returns OIDC logout URL',
  })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('initiate')
  async initiate(
    @Body() { targetUserId }: { targetUserId: number },
    @Request() req,
  ): Promise<{ oidcLogoutUrl: string }> {
    return this.impersonationService.initiateImpersonation(
      req.user.sub,
      targetUserId,
    );
  }

  @ApiOperation({
    summary:
      'Exchange impersonation token for access token (called after OIDC logout callback)',
  })
  @HttpCode(HttpStatus.OK)
  @Post('callback')
  async callback(
    @Query('token') token: string,
    @Query('userId') userId: number,
  ): Promise<{ access_token: string }> {
    return this.impersonationService.impersonateUserData({
      token,
      userId,
    } as ImpersonateDto);
  }
}
