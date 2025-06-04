import { Module } from '@nestjs/common';
import { MetadataService } from './metadata.service';
import { MetadataController } from './metadata.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Metadata } from './entities/metadata.entity';
import { LinkMetadataFormatGroupModule } from '../../LinkModules/link-metadata-format-group/link-metadata-format-group.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Metadata]),
    LinkMetadataFormatGroupModule,
  ],
  controllers: [MetadataController],
  providers: [MetadataService],
  exports: [MetadataService],
})
export class MetadataModule {}
