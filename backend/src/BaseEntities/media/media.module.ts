import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { LinkMediaGroup } from '../../LinkModules/link-media-group/entities/link-media-group.entity';

@Module({
  exports: [MediaService],
  imports: [TypeOrmModule.forFeature([Media, LinkMediaGroup])],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
