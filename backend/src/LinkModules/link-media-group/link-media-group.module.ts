import { Module } from '@nestjs/common';
import { LinkMediaGroupService } from './link-media-group.service';
import { LinkMediaGroupController } from './link-media-group.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkMediaGroup } from './entities/link-media-group.entity';
import { UserGroup } from '../../BaseEntities/user-group/entities/user-group.entity';
import { Media } from '../../BaseEntities/media/entities/media.entity';
import { UserGroupModule } from '../../BaseEntities/user-group/user-group.module';
import { MediaModule } from '../../BaseEntities/media/media.module';
import { LinkUserGroupModule } from '../link-user-group/link-user-group.module';

@Module({
  exports: [LinkMediaGroupService],
  imports: [
    UserGroupModule,
    MediaModule,
    LinkUserGroupModule,
    TypeOrmModule.forFeature([LinkMediaGroup, UserGroup, Media]),
  ],
  controllers: [LinkMediaGroupController],
  providers: [LinkMediaGroupService],
})
export class LinkMediaGroupModule {}
