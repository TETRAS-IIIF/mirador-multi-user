import { Module } from '@nestjs/common';
import { ManifestService } from './manifest.service';
import { ManifestController } from './manifest.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Manifest } from './entities/manifest.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Manifest])],
  controllers: [ManifestController],
  providers: [ManifestService],
  exports: [ManifestService],
})
export class ManifestModule {}
