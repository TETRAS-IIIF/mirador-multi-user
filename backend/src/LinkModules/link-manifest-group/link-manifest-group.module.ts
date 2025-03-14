import { Module } from '@nestjs/common';
import { LinkManifestGroupService } from './link-manifest-group.service';
import { LinkManifestGroupController } from './link-manifest-group.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkManifestGroup } from './entities/link-manifest-group.entity';
import { ManifestModule } from '../../BaseEntities/manifest/manifest.module';
import { UserGroupModule } from '../../BaseEntities/user-group/user-group.module';
import { LinkUserGroupModule } from '../link-user-group/link-user-group.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LinkManifestGroup]),
    ManifestModule,
    UserGroupModule,
    LinkUserGroupModule,
  ],
  controllers: [LinkManifestGroupController],
  providers: [LinkManifestGroupService],
  exports: [LinkManifestGroupService],
})
export class LinkManifestGroupModule {}
