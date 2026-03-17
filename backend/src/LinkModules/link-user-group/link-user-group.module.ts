import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkUserGroup } from './entities/link-user-group.entity';
import { LinkUserGroupService } from './link-user-group.service';
import { LinkUserGroupController } from './link-user-group.controller';
import { UserGroupModule } from '../../BaseEntities/user-group/user-group.module';
import { UsersModule } from '../../BaseEntities/users/users.module';
import { EmailServerController } from '../../utils/email/email.controller';
import { EmailServerService } from '../../utils/email/email.service';
import { LinkMetadataFormatGroupModule } from '../link-metadata-format-group/link-metadata-format-group.module';
import { SettingsModule } from '../../BaseEntities/setting/setting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LinkUserGroup]),
    UserGroupModule,
    UsersModule,
    LinkMetadataFormatGroupModule,
    SettingsModule,
  ],
  providers: [LinkUserGroupService, EmailServerService],
  controllers: [LinkUserGroupController, EmailServerController],
  exports: [LinkUserGroupService],
})
export class LinkUserGroupModule {}
