import { Module } from '@nestjs/common';
import { LinkGroupProjectService } from './link-group-project.service';
import { LinkGroupProjectController } from './link-group-project.controller';
import { Project } from '../../BaseEntities/project/entities/project.entity';
import { UserGroup } from '../../BaseEntities/user-group/entities/user-group.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkGroupProject } from './entities/link-group-project.entity';
import { ProjectModule } from '../../BaseEntities/project/project.module';
import { UserGroupModule } from '../../BaseEntities/user-group/user-group.module';
import { LinkUserGroupModule } from '../link-user-group/link-user-group.module';
import { MetadataModule } from '../../BaseEntities/metadata/metadata.module';
import { EmailServerModule } from '../../utils/email/email.module';

//TODO: The import on LinkUserGroupModule there is a toxic pattern and should be removed because it could lead to circular dependencies. The logic where we need LinkGroupProjectService and another LinkModule should be moved in a different module.
@Module({
  exports: [LinkGroupProjectService],
  imports: [
    TypeOrmModule.forFeature([LinkGroupProject, Project, UserGroup]),
    ProjectModule,
    UserGroupModule,
    LinkUserGroupModule,
    MetadataModule,
  ],
  controllers: [LinkGroupProjectController],
  providers: [LinkGroupProjectService],
})
export class LinkGroupProjectModule {}
