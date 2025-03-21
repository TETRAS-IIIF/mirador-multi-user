import { Module } from '@nestjs/common';
import { UserGroupService } from './user-group.service';
import { UserGroupController } from './user-group.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGroup } from './entities/user-group.entity';
import { LinkGroupProject } from '../../LinkModules/link-group-project/entities/link-group-project.entity';
import { LinkMediaGroup } from '../../LinkModules/link-media-group/entities/link-media-group.entity';
import { Media } from '../media/entities/media.entity';
import { LinkUserGroup } from '../../LinkModules/link-user-group/entities/link-user-group.entity';

@Module({
  exports: [UserGroupService],
  imports: [
    TypeOrmModule.forFeature([
      UserGroup,
      LinkGroupProject,
      LinkMediaGroup,
      LinkUserGroup,
      Media,
    ]),
  ],
  controllers: [UserGroupController],
  providers: [UserGroupService],
})
export class UserGroupModule {}
