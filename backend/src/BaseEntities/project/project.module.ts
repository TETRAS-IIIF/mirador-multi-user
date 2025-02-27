import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { CaslAbilityFactory } from '../../utils/casl/casl-ability.factory/casl-ability.factory';
import { LinkGroupProject } from '../../LinkModules/link-group-project/entities/link-group-project.entity';
import { UserGroup } from '../user-group/entities/user-group.entity';

@Module({
  exports: [ProjectService],
  imports: [TypeOrmModule.forFeature([Project, LinkGroupProject, UserGroup])],
  controllers: [ProjectController],
  providers: [ProjectService, CaslAbilityFactory],
})
export class ProjectModule {}
