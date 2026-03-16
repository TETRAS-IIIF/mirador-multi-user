import { Module } from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { UsersModule } from '../BaseEntities/users/users.module';
import { ProjectModule } from '../BaseEntities/project/project.module';
import { LinkGroupProjectModule } from '../LinkModules/link-group-project/link-group-project.module';
import { LinkManifestGroupModule } from '../LinkModules/link-manifest-group/link-manifest-group.module';
import { ManifestModule } from '../BaseEntities/manifest/manifest.module';
import { MediaModule } from '../BaseEntities/media/media.module';
import { LinkMediaGroupModule } from '../LinkModules/link-media-group/link-media-group.module';
import { UserGroupModule } from '../BaseEntities/user-group/user-group.module';
import { UserManagementController } from './user-management.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkUserGroup } from '../LinkModules/link-user-group/entities/link-user-group.entity';
import { EmailServerService } from '../utils/email/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LinkUserGroup]),
    UsersModule,
    ProjectModule,
    LinkGroupProjectModule,
    LinkManifestGroupModule,
    ManifestModule,
    MediaModule,
    LinkMediaGroupModule,
    UserGroupModule,
  ],
  providers: [UserManagementService, EmailServerService],
  exports: [UserManagementService],
  controllers: [UserManagementController],
})
export class UserManagementModule {}
