import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../BaseEntities/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { EmailServerService } from '../utils/email/email.service';
import { ImpersonationModule } from '../impersonation/impersonation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './src/config/.env.old.dev',
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    UsersModule,
    ImpersonationModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailServerService],
  exports: [AuthService],
})
export class AuthModule {}
