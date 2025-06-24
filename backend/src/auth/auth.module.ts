// auth.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../BaseEntities/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { EmailServerService } from '../utils/email/email.service';
import { ImpersonationModule } from '../impersonation/impersonation.module';
import * as passport from 'passport';
import { createOidcStrategy } from './oidc.strategy';
import { LinkUserGroupModule } from '../LinkModules/link-user-group/link-user-group.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './src/config/.env.old.dev',
      isGlobal: true,
    }),
    PassportModule.register({ session: true }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    UsersModule,
    ImpersonationModule,
    LinkUserGroupModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailServerService],
  exports: [AuthService],
})
export class AuthModule implements OnModuleInit {
  async onModuleInit() {
    const strategy = await createOidcStrategy();
    passport.use('oidc', strategy);
  }
}
