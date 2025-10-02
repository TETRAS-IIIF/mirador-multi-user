// auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../BaseEntities/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { EmailServerService } from '../utils/email/email.service';
import { ImpersonationModule } from '../impersonation/impersonation.module';
import { LinkUserGroupModule } from '../LinkModules/link-user-group/link-user-group.module';
import { JwtStrategy } from './jwt.strategy';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './src/config/.env.old.dev',
      isGlobal: true,
    }),
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    UsersModule,
    ImpersonationModule,
    LinkUserGroupModule,
    MetricsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailServerService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
