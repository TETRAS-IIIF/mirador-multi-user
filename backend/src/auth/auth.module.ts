import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../BaseEntities/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { EmailServerService } from '../utils/email/email.service';
import { ImpersonationModule } from '../impersonation/impersonation.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../jwt.stategy';
import { JwtAuthGuard } from './jwtauth.guard';
import { OidcAuthGuard } from '../OidcAuthGuard';
import { DynamicPassportGuard } from './dynamicAuth.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './src/config/.env.old.dev',
    }),
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    UsersModule,
    ImpersonationModule,
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: DynamicPassportGuard,
    },
    AuthService,
    EmailServerService,
    JwtStrategy,
    JwtAuthGuard,
    OidcAuthGuard,
    DynamicPassportGuard,
  ],
  exports: [AuthService, DynamicPassportGuard],
})
export class AuthModule {}
