import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './BaseEntities/users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './BaseEntities/project/project.module';
import { CaslModule } from './utils/casl/casl.module';
import { MediaModule } from './BaseEntities/media/media.module';
import { UserGroupModule } from './BaseEntities/user-group/user-group.module';
import { LinkGroupProjectModule } from './LinkModules/link-group-project/link-group-project.module';
import { LinkMediaGroupModule } from './LinkModules/link-media-group/link-media-group.module';
import { LinkUserGroupModule } from './LinkModules/link-user-group/link-user-group.module';
import { ManifestModule } from './BaseEntities/manifest/manifest.module';
import dbConfiguration from './config/db.config';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { EmailServerModule } from './utils/email/email.module';
import { CustomLogger } from './utils/Logger/CustomLogger.service';
import { LinkManifestGroupModule } from './LinkModules/link-manifest-group/link-manifest-group.module';
import { EmailConfirmationModule } from './email-confirmation/email-confirmation.module';
import { UserManagementModule } from './user-management/user-management.module';
import { MetadataFormatModule } from './BaseEntities/metadata-format/metadata-format.module';
import { LinkMetadataFormatGroupModule } from './LinkModules/link-metadata-format-group/link-metadata-format-group.module';
import { MetadataModule } from './BaseEntities/metadata/metadata.module';
import { ImpersonationModule } from './impersonation/impersonation.module';
import { AnnotationPageModule } from './BaseEntities/annotation-page/annotation-page.module';
import { SnapshotModule } from './BaseEntities/snapshot/snapshot.module';
import { SettingsModule } from './BaseEntities/setting/setting.module';
import { DatabaseModule } from './BaseEntities/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './src/config/.env.old.dev',
      load: [dbConfiguration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
    }),
    MailerModule.forRoot({
      transport: {
        host: String(process.env.SMTP_DOMAIN),
        port: Number(process.env.SMTP_PORT),
        ignoreTLS: process.env.SMTP_IGNORE_TLS === 'true',
        secure: process.env.SMTP_SSL === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        socketTimeout: 10000,
        connectionTimeout: 10000,
        debug: true,
      },
      defaults: {
        from: `"${process.env.NAME_MAIL}" <${process.env.FROM_MAIL}>`,
      },
      template: {
        dir: __dirname + './template/notification',
        adapter: new PugAdapter({ inlineCssEnabled: true }),
        options: {
          strict: true,
        },
      },
    }),
    UsersModule,
    AuthModule,
    ProjectModule,
    CaslModule,
    MediaModule,
    UserGroupModule,
    LinkGroupProjectModule,
    LinkMediaGroupModule,
    LinkUserGroupModule,
    LinkManifestGroupModule,
    ManifestModule,
    EmailServerModule,
    EmailConfirmationModule,
    UserManagementModule,
    MetadataFormatModule,
    LinkMetadataFormatGroupModule,
    MetadataModule,
    ImpersonationModule,
    AnnotationPageModule,
    SnapshotModule,
    SettingsModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: Logger,
      useClass: CustomLogger,
    },
  ],
})
export class AppModule {}
