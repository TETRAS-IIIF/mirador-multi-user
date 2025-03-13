import { Module } from '@nestjs/common';
import { SnapshotService } from './snapshot.service';
import { Snapshot } from './entities/snapshot.entity';
import { Project } from '../project/entities/project.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Snapshot, Project])],
  providers: [SnapshotService],
  controllers: [],
  exports: [SnapshotService],
})
export class SnapshotModule {}
