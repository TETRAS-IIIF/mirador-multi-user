import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginDto } from './dto/login.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return this.authService.findProfile(req.user.sub);
  }

  @ApiOperation({ summary: 'send recovery password link' })
  @HttpCode(200)
  @Post('forgot-password')
  async forgotPassword(@Body() { email }: { email: string }): Promise<void> {
    return this.authService.forgotPassword(email);
  }

  @ApiOperation({ summary: 'reset password' })
  @HttpCode(200)
  @Post('reset-password')
  async resetPassword(
    @Body() { token, password }: { token: string; password: string },
  ): Promise<void> {
    return this.authService.resetPassword(token, password);
  }

  @Get('oidc')
  @UseGuards(AuthGuard('oidc'))
  oidcLogin() {
    // This triggers the redirect to the OpenID provider
  }

  @Get('oidc/callback')
  @UseGuards(AuthGuard('oidc'))
  async oidcCallback(@Req() req) {
    const { token } = await this.authService.handleOidcLogin(req.user);
    return { token };
  }
}
