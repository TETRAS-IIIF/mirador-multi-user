import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginDto } from './dto/login.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Public } from './dynamicAuth.guard';

@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: 'Login with your credentials' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: loginDto) {
    return this.authService.signIn(
      signInDto.mail,
      signInDto.password,
      signInDto.isImpersonate,
    );
  }

  @ApiOperation({ summary: 'get your profile' })
  @Get('profile')
  getProfile(@Request() req) {
    return this.authService.findProfile(req.user.sub);
  }

  @Public()
  @ApiOperation({ summary: 'send recovery password link' })
  @HttpCode(200)
  @Post('forgot-password')
  async forgotPassword(@Body() { email }: { email: string }): Promise<void> {
    return this.authService.forgotPassword(email);
  }

  @Public()
  @ApiOperation({ summary: 'reset password' })
  @HttpCode(200)
  @Post('reset-password')
  async resetPassword(
    @Body() { token, password }: { token: string; password: string },
  ): Promise<void> {
    return this.authService.resetPassword(token, password);
  }

  @Public()
  @Post('openid-exchange')
  async exchangeCode(@Body() body: { code: string; redirectUri: string }) {
    return await this.authService.exchangeKeycloakCode(
      body.code,
      body.redirectUri,
    );
  }
}
