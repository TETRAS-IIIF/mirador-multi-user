import { Module } from '@nestjs/common';
import { LinkMediaGroupService } from './link-media-group.service';
import { LinkMediaGroupController } from './link-media-group.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkMediaGroup } from './entities/link-media-group.entity';
import { UserGroup } from '../user-group/entities/user-group.entity';
import { Media } from '../media/entities/media.entity';
import { UserGroupModule } from '../user-group/user-group.module';
import { MediaModule } from '../media/media.module';

@Module({
  exports: [LinkMediaGroupService],
  imports: [
    UserGroupModule,
    MediaModule,
    TypeOrmModule.forFeature([LinkMediaGroup, UserGroup, Media]),
  ],
  controllers: [LinkMediaGroupController],
  providers: [LinkMediaGroupService],
})
export class LinkMediaGroupModule {}
